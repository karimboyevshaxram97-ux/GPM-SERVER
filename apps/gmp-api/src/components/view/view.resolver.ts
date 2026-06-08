import { Resolver, Mutation, Query, Args, Int } from '@nestjs/graphql';
import { ViewService } from './view.service';
import { ViewTargetType } from '../../libs/enums';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver()
export class ViewResolver {
  constructor(private readonly viewService: ViewService) {}

  @Public()
  @Mutation(() => Int, { name: 'recordView' })
  async recordView(
    @Args('targetId') targetId: string,
    @Args('targetType', { type: () => ViewTargetType }) targetType: ViewTargetType,
    @CurrentUser() user: any,
  ): Promise<number> {
    const viewerId = user?._id?.toString();
    return this.viewService.recordView(targetId, targetType, viewerId);
  }

  @Public()
  @Query(() => Int, { name: 'getViewCount' })
  async getViewCount(
    @Args('targetId') targetId: string,
    @Args('targetType', { type: () => ViewTargetType }) targetType: ViewTargetType,
  ): Promise<number> {
    return this.viewService.getViewCount(targetId, targetType);
  }
}
