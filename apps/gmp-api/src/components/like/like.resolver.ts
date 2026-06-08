import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeResult } from '../../libs/dto/like/like.type';
import { LikeTargetType } from '../../libs/enums';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Resolver()
export class LikeResolver {
  constructor(private readonly likeService: LikeService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => LikeResult, { name: 'toggleLike' })
  async toggleLike(
    @Args('targetId') targetId: string,
    @Args('targetType', { type: () => LikeTargetType }) targetType: LikeTargetType,
    @CurrentUser() user: any,
  ): Promise<LikeResult> {
    return this.likeService.toggleLike(user._id.toString(), targetId, targetType);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => LikeResult, { name: 'getLikeStatus' })
  async getLikeStatus(
    @Args('targetId') targetId: string,
    @Args('targetType', { type: () => LikeTargetType }) targetType: LikeTargetType,
    @CurrentUser() user: any,
  ): Promise<LikeResult> {
    return this.likeService.getLikeStatus(user._id.toString(), targetId, targetType);
  }
}
