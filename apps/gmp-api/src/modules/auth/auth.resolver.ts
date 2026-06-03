import { UseGuards } from '@nestjs/common';
import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth-response.type';
import { LoginInput } from './dto/login.input';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { RegisterInput } from './dto/register.input';
import { UserType } from '../user/dto/user.type';
import { GqlJwtAuthGuard } from '../../common/guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from '../../common/guards/gql-roles.guard';
import { UserRole } from '../../common/enums/user.enum';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResponse, { name: 'register' })
  async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
    return this.authService.register(input as any);
  }

  @Public()
  @Mutation(() => AuthResponse, { name: 'login' })
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    return this.authService.login(input);
  }

  @Public()
  @Mutation(() => AuthResponse, { name: 'refreshToken' })
  async refreshToken(@Args('input') input: RefreshTokenInput): Promise<AuthResponse> {
    return this.authService.refreshToken(input);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => UserType, { name: 'me' })
  async me(@CurrentUser() user: any): Promise<any> {
    return user;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Boolean, { name: 'logout' })
  async logout(@CurrentUser() user: any): Promise<boolean> {
    return this.authService.logout(user._id.toString());
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Query(() => String, { name: 'adminOnly' })
  async adminOnly(): Promise<string> {
    return 'Access granted for SUPER_ADMIN';
  }
}
