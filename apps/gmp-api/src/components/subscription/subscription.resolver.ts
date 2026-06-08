import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionPlanType, AgencySubscriptionType } from '../../libs/dto/subscription/subscription.type';
import { CreateSubscriptionPlanInput, SubscribeToPlanInput } from '../../libs/dto/subscription/subscription.input';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { GqlRolesGuard } from '../auth/guards/gql-roles.guard';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { UserRole } from '../../libs/enums';

@Resolver()
export class SubscriptionResolver {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Public()
  @Query(() => [SubscriptionPlanType], { name: 'subscriptionPlans' })
  async subscriptionPlans(): Promise<SubscriptionPlanType[]> {
    return this.subscriptionService.getPublicPlans() as any;
  }

  @Public()
  @Query(() => SubscriptionPlanType, { name: 'subscriptionPlan', nullable: true })
  async subscriptionPlan(@Args('id') id: string): Promise<SubscriptionPlanType | null> {
    return this.subscriptionService.getPlanById(id) as any;
  }

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Query(() => [SubscriptionPlanType], { name: 'allSubscriptionPlans' })
  async allSubscriptionPlans(): Promise<SubscriptionPlanType[]> {
    return this.subscriptionService.getAllPlans() as any;
  }

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => SubscriptionPlanType, { name: 'createSubscriptionPlan' })
  async createSubscriptionPlan(
    @Args('input') input: CreateSubscriptionPlanInput,
  ): Promise<SubscriptionPlanType> {
    return this.subscriptionService.createPlan(input) as any;
  }

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => SubscriptionPlanType, { name: 'archiveSubscriptionPlan' })
  async archiveSubscriptionPlan(@Args('id') id: string): Promise<SubscriptionPlanType> {
    return this.subscriptionService.archivePlan(id) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AgencySubscriptionType, { name: 'subscribeToPlan' })
  async subscribeToPlan(@Args('input') input: SubscribeToPlanInput): Promise<AgencySubscriptionType> {
    return this.subscriptionService.subscribeToPlan(input) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [AgencySubscriptionType], { name: 'agencySubscriptions' })
  async agencySubscriptions(@Args('agencyId') agencyId: string): Promise<AgencySubscriptionType[]> {
    return this.subscriptionService.getAgencySubscriptions(agencyId) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => AgencySubscriptionType, { name: 'activeSubscription', nullable: true })
  async activeSubscription(@Args('agencyId') agencyId: string): Promise<AgencySubscriptionType | null> {
    return this.subscriptionService.getActiveSubscription(agencyId) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AgencySubscriptionType, { name: 'cancelSubscription' })
  async cancelSubscription(@Args('subscriptionId') subscriptionId: string): Promise<AgencySubscriptionType> {
    return this.subscriptionService.cancelSubscription(subscriptionId) as any;
  }
}
