import { UseGuards } from '@nestjs/common';
import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { AuthService } from './auth.service';
import { AuthResponse } from '../../libs/dto/auth/auth-response.type';
import { LoginInput } from '../../libs/dto/auth/login.input';
import { RefreshTokenInput } from '../../libs/dto/auth/refresh-token.input';
import { RegisterInput } from '../../libs/dto/auth/register.input';
import { UserType } from '../../libs/dto/user/user.type';
import { GqlJwtAuthGuard } from './guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from './guards/gql-roles.guard';
import { UserRole } from '../../libs/enums/user.enum';

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
