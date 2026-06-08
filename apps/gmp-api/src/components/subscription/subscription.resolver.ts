import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionPlanType, AgencySubscriptionType } from '../../libs/dto/subscription/subscription.type';
import { CreateSubscriptionPlanInput, SubscribeToPlanInput } from '../../libs/dto/subscription/subscription.input';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { GqlRolesGuard } from '../auth/guards/gql-roles.guard';
import { UserRole } from '../../libs/enums';

@Resolver()
export class SubscriptionResolver {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Public()
  @Query(() => [SubscriptionPlanType], { name: 'subscriptionPlans' })
  async subscriptionPlans(): Promise<SubscriptionPlanType[]> {
    console.log('Query: subscriptionPlans');
    return this.subscriptionService.getPublicPlans() as any;
  }

  @Public()
  @Query(() => SubscriptionPlanType, { name: 'subscriptionPlan', nullable: true })
  async subscriptionPlan(@Args('id') id: string): Promise<SubscriptionPlanType | null> {
    console.log('Query: subscriptionPlan');
    return this.subscriptionService.getPlanById(id) as any;
  }

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Query(() => [SubscriptionPlanType], { name: 'allSubscriptionPlans' })
  async allSubscriptionPlans(): Promise<SubscriptionPlanType[]> {
    console.log('Query: allSubscriptionPlans');
    return this.subscriptionService.getAllPlans() as any;
  }

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => SubscriptionPlanType, { name: 'createSubscriptionPlan' })
  async createSubscriptionPlan(
    @Args('input') input: CreateSubscriptionPlanInput,
  ): Promise<SubscriptionPlanType> {
    console.log('Mutation: createSubscriptionPlan');
    return this.subscriptionService.createPlan(input) as any;
  }

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => SubscriptionPlanType, { name: 'archiveSubscriptionPlan' })
  async archiveSubscriptionPlan(@Args('id') id: string): Promise<SubscriptionPlanType> {
    console.log('Mutation: archiveSubscriptionPlan');
    return this.subscriptionService.archivePlan(id) as any;
  }

  @Mutation(() => AgencySubscriptionType, { name: 'subscribeToPlan' })
  async subscribeToPlan(@Args('input') input: SubscribeToPlanInput): Promise<AgencySubscriptionType> {
    console.log('Mutation: subscribeToPlan');
    return this.subscriptionService.subscribeToPlan(input) as any;
  }

  @Query(() => [AgencySubscriptionType], { name: 'agencySubscriptions' })
  async agencySubscriptions(@Args('agencyId') agencyId: string): Promise<AgencySubscriptionType[]> {
    console.log('Query: agencySubscriptions');
    return this.subscriptionService.getAgencySubscriptions(agencyId) as any;
  }

  @Query(() => AgencySubscriptionType, { name: 'activeSubscription', nullable: true })
  async activeSubscription(@Args('agencyId') agencyId: string): Promise<AgencySubscriptionType | null> {
    console.log('Query: activeSubscription');
    return this.subscriptionService.getActiveSubscription(agencyId) as any;
  }

  @Mutation(() => AgencySubscriptionType, { name: 'cancelSubscription' })
  async cancelSubscription(@Args('subscriptionId') subscriptionId: string): Promise<AgencySubscriptionType> {
    console.log('Mutation: cancelSubscription');
    return this.subscriptionService.cancelSubscription(subscriptionId) as any;
  }
}
