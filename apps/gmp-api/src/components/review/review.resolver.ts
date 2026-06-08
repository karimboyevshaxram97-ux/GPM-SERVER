import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewType } from '../../libs/dto/review/review.type';
import { CreateReviewInput } from '../../libs/dto/review/review.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AgencyService } from '../agency/agency.service';
import { ServiceService } from '../service/service.service';
import { Public } from '../auth/decorators/public.decorator';

@Resolver(() => ReviewType)
export class ReviewResolver {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly agencyService: AgencyService,
    private readonly serviceService: ServiceService,
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
    }

    return this.reviewService.create(input, user._id.toString()) as any;
  }
}
