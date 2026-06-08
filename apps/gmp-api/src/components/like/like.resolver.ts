import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { LikeService } from './like.service';
import { LikeResult } from '../../libs/dto/like/like.type';
import { LikeTargetType } from '../../libs/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver()
export class LikeResolver {
  constructor(private readonly likeService: LikeService) {}

  @Mutation(() => LikeResult, { name: 'toggleLike' })
  async toggleLike(
    @Args('targetId') targetId: string,
    @Args('targetType', { type: () => LikeTargetType }) targetType: LikeTargetType,
    @CurrentUser() user: any,
  ): Promise<LikeResult> {
    console.log('Mutation: toggleLike');
    return this.likeService.toggleLike(user._id.toString(), targetId, targetType);
  }

  @Query(() => LikeResult, { name: 'getLikeStatus' })
  async getLikeStatus(
    @Args('targetId') targetId: string,
    @Args('targetType', { type: () => LikeTargetType }) targetType: LikeTargetType,
    @CurrentUser() user: any,
  ): Promise<LikeResult> {
    console.log('Query: getLikeStatus');
    return this.likeService.getLikeStatus(user._id.toString(), targetId, targetType);
  }
}
