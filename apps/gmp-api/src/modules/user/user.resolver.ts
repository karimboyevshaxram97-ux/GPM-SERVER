import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserType } from './dto/user.type';
import { GqlJwtAuthGuard } from '../../common/guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from '../../common/guards/gql-roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user.enum';

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
