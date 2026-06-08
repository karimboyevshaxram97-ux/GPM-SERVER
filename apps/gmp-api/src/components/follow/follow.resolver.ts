import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FollowService } from './follow.service';
import { FollowType, FollowStatusType } from '../../libs/dto/follow/follow.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WithoutAuth } from '../auth/guards/without.guard';

@Resolver()
export class FollowResolver {
  constructor(private readonly followService: FollowService) {}

  @Mutation(() => FollowType, { name: 'followAgency' })
  async followAgency(
    @Args('agencyId') agencyId: string,
    @CurrentUser() user: any,
  ): Promise<FollowType> {
    console.log('Mutation: followAgency');
    return this.followService.follow(user._id.toString(), agencyId) as any;
  }

  @Mutation(() => Boolean, { name: 'unfollowAgency' })
  async unfollowAgency(
    @Args('agencyId') agencyId: string,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    console.log('Mutation: unfollowAgency');
    return this.followService.unfollow(user._id.toString(), agencyId);
  }

  @Mutation(() => FollowType, { name: 'toggleFollowNotifications' })
  async toggleFollowNotifications(
    @Args('agencyId') agencyId: string,
    @CurrentUser() user: any,
  ): Promise<FollowType> {
    console.log('Mutation: toggleFollowNotifications');
    return this.followService.toggleNotifications(user._id.toString(), agencyId) as any;
  }

  @Query(() => FollowStatusType, { name: 'followStatus' })
  async followStatus(
    @Args('agencyId') agencyId: string,
    @CurrentUser() user: any,
  ): Promise<FollowStatusType> {
    console.log('Query: followStatus');
    return this.followService.isFollowing(user._id.toString(), agencyId);
  }

  @Query(() => [FollowType], { name: 'myFollowingAgencies' })
  async myFollowingAgencies(@CurrentUser() user: any): Promise<FollowType[]> {
    console.log('Query: myFollowingAgencies');
    return this.followService.getFollowingAgencies(user._id.toString()) as any;
  }

  @WithoutAuth()
  @Query(() => [FollowType], { name: 'agencyFollowers' })
  async agencyFollowers(
    @Args('agencyId') agencyId: string,
    @CurrentUser() user: any,
  ): Promise<FollowType[]> {
    console.log('Query: agencyFollowers');
    return this.followService.getAgencyFollowers(agencyId) as any;
  }
}
