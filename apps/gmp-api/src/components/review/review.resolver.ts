import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewType } from '../../libs/dto/review/review.type';
import { CreateReviewInput } from '../../libs/dto/review/review.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AgencyService } from '../agency/agency.service';
import { ServiceService } from '../service/service.service';
import { Public } from '../auth/decorators/public.decorator';
import { ApplicationService } from '../application/application.service';
import { ApplicationStatus } from '../../libs/enums';

@Resolver(() => ReviewType)
export class ReviewResolver {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly agencyService: AgencyService,
    private readonly serviceService: ServiceService,
    private readonly applicationService: ApplicationService,
  ) {}

  @Public()
  @Query(() => [ReviewType], { name: 'reviewsByAgency' })
  async reviewsByAgency(@Args('agencyId') agencyId: string): Promise<ReviewType[]> {
    console.log('Query: reviewsByAgency');
    return this.reviewService.findByAgency(agencyId) as any;
  }

  @Public()
  @Query(() => [ReviewType], { name: 'reviewsByService' })
  async reviewsByService(@Args('serviceId') serviceId: string): Promise<ReviewType[]> {
    console.log('Query: reviewsByService');
    return this.reviewService.findByService(serviceId) as any;
  }

  @Mutation(() => ReviewType, { name: 'createReview' })
  async createReview(
    @Args('input') input: CreateReviewInput,
    @CurrentUser() user: any,
  ): Promise<ReviewType> {
    console.log('Mutation: createReview');
    const agency = await this.agencyService.findById(input.agencyId);
    if (!agency) throw new NotFoundException('Agency not found');

    if (input.serviceId) {
      const service = await this.serviceService.findById(input.serviceId);
      if (!service) throw new NotFoundException('Service not found');
      if (service.agency.toString() !== input.agencyId) {
        throw new BadRequestException('Service does not belong to this agency');
      }
    }

    const alreadyReviewed = await this.reviewService.existsByUserAndTarget(
      user._id.toString(),
      input.agencyId,
      input.serviceId,
    );
    if (alreadyReviewed) throw new BadRequestException('Review already exists');

    if (input.serviceId) {
      const applications = await this.applicationService.findByService(input.serviceId);
      const hasCompletedApplication = applications.some(
        (application) =>
          application.user.toString() === user._id.toString() &&
          application.status === ApplicationStatus.COMPLETED,
      );
      if (!hasCompletedApplication) throw new ForbiddenException('Completed application is required to review');
    }

    return this.reviewService.create(input, user._id.toString()) as any;
  }
}
