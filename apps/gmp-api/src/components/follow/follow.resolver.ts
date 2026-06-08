import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowType, FollowStatusType } from '../../libs/dto/follow/follow.type';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Resolver(() => FollowType)
export class FollowResolver {
  constructor(private readonly followService: FollowService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => FollowType, { name: 'followAgency' })
  async followAgency(
    @Args('agencyId') agencyId: string,
    @CurrentUser() user: any,
  ): Promise<FollowType> {
    return this.followService.follow(user.userId, agencyId) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Boolean, { name: 'unfollowAgency' })
  async unfollowAgency(
    @Args('agencyId') agencyId: string,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    return this.followService.unfollow(user.userId, agencyId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => FollowType, { name: 'toggleFollowNotifications' })
  async toggleFollowNotifications(
    @Args('agencyId') agencyId: string,
    @CurrentUser() user: any,
  ): Promise<FollowType> {
    return this.followService.toggleNotifications(user.userId, agencyId) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => FollowStatusType, { name: 'followStatus' })
  async followStatus(
    @Args('agencyId') agencyId: string,
    @CurrentUser() user: any,
  ): Promise<FollowStatusType> {
    return this.followService.isFollowing(user.userId, agencyId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [FollowType], { name: 'myFollowingAgencies' })
  async myFollowingAgencies(@CurrentUser() user: any): Promise<FollowType[]> {
    return this.followService.getFollowingAgencies(user.userId) as any;
  }

  @Public()
  @Query(() => [FollowType], { name: 'agencyFollowers' })
  async agencyFollowers(@Args('agencyId') agencyId: string): Promise<FollowType[]> {
    return this.followService.getAgencyFollowers(agencyId) as any;
  }
}
