import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewType } from './dto/review.type';
import { CreateReviewInput } from './dto/review.input';
import { GqlJwtAuthGuard } from '../../common/guards/gql-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AgencyService } from '../agency/agency.service';
import { ServiceService } from '../service/service.service';
import { Public } from '../../common/decorators/public.decorator';

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
    return this.reviewService.findByAgency(agencyId) as any;
  }

  @Public()
  @Query(() => [ReviewType], { name: 'reviewsByService' })
  async reviewsByService(@Args('serviceId') serviceId: string): Promise<ReviewType[]> {
    return this.reviewService.findByService(serviceId) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ReviewType, { name: 'createReview' })
  async createReview(
    @Args('input') input: CreateReviewInput,
    @CurrentUser() user: any,
  ): Promise<ReviewType> {
    const agency = await this.agencyService.findById(input.agencyId);
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    if (input.serviceId) {
      const service = await this.serviceService.findById(input.serviceId);
      if (!service) {
        throw new NotFoundException('Service not found');
      }
    }

    return this.reviewService.create(input, user._id.toString(), input.agencyId, input.serviceId) as any;
  }
}
