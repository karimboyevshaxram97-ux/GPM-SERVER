import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserType } from '../../libs/dto/user/user.type';
import { GqlRolesGuard } from '../auth/guards/gql-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
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
}
