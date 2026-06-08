import { Resolver, Mutation, Query, Args, Int } from '@nestjs/graphql';
import { ViewService } from './view.service';
import { ViewTargetType } from '../../libs/enums';
import { Public } from '../auth/decorators/public.decorator';
import { WithoutAuth } from '../auth/guards/without.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver()
export class ViewResolver {
  constructor(private readonly viewService: ViewService) {}

  @WithoutAuth()
  @Mutation(() => Int, { name: 'recordView' })
  async recordView(
    @Args('targetId') targetId: string,
    @Args('targetType', { type: () => ViewTargetType }) targetType: ViewTargetType,
    @CurrentUser() user: any,
  ): Promise<number> {
    console.log('Mutation: recordView');
    const viewerId = user?._id?.toString();
    return this.viewService.recordView(targetId, targetType, viewerId);
  }

  @Public()
  @Query(() => Int, { name: 'getViewCount' })
  async getViewCount(
    @Args('targetId') targetId: string,
    @Args('targetType', { type: () => ViewTargetType }) targetType: ViewTargetType,
  ): Promise<number> {
    console.log('Query: getViewCount');
    return this.viewService.getViewCount(targetId, targetType);
  }
}
