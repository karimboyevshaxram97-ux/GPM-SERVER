import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserType } from '../../libs/dto/user/user.type';
import { UpdateUserInput } from '../../libs/dto/user/update-user.input';
import { GqlRolesGuard } from '../auth/guards/gql-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../libs/enums/user.enum';

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Query(() => [UserType], { name: 'members' })
  async members(): Promise<UserType[]> {
    console.log('Query: members');
    return this.userService.findAll() as any;
  }

  @Public()
  @Query(() => UserType, { name: 'member', nullable: true })
  async member(@Args('id') id: string): Promise<UserType | null> {
    console.log('Query: member');
    return this.userService.findById(id) as any;
  }

  @Mutation(() => UserType, { name: 'updateMe' })
  async updateMe(
    @Args('input') input: UpdateUserInput,
    @CurrentUser() user: any,
  ): Promise<UserType> {
    console.log('Mutation: updateMe');
    return this.userService.updateMe(user._id.toString(), input) as any;
  }
}
