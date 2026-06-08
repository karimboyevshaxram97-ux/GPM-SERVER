import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserType } from '../../libs/dto/user/user.type';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from '../auth/guards/gql-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../libs/enums/user.enum';

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Query(() => [UserType], { name: 'members' })
  async members(): Promise<UserType[]> {
    return this.userService.findAll() as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => UserType, { name: 'member', nullable: true })
  async member(@Args('id') id: string): Promise<UserType | null> {
    return this.userService.findById(id) as any;
  }
}
