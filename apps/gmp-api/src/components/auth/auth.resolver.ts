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
import { GqlRolesGuard } from './guards/gql-roles.guard';
import { UserRole } from '../../libs/enums/user.enum';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResponse, { name: 'register' })
  async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
    console.log('Mutation: register');
    return this.authService.register(input as any);
  }

  @Public()
  @Mutation(() => AuthResponse, { name: 'login' })
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    console.log('Mutation: login');
    return this.authService.login(input);
  }

  @Public()
  @Mutation(() => AuthResponse, { name: 'refreshToken' })
  async refreshToken(@Args('input') input: RefreshTokenInput): Promise<AuthResponse> {
    console.log('Mutation: refreshToken');
    return this.authService.refreshToken(input);
  }

  @Query(() => UserType, { name: 'me' })
  async me(@CurrentUser() user: any): Promise<any> {
    console.log('Query: me');
    return user;
  }

  @Mutation(() => Boolean, { name: 'logout' })
  async logout(@CurrentUser() user: any): Promise<boolean> {
    console.log('Mutation: logout');
    return this.authService.logout(user._id.toString());
  }

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Query(() => String, { name: 'adminOnly' })
  async adminOnly(): Promise<string> {
    console.log('Query: adminOnly');
    return 'Access granted for SUPER_ADMIN';
  }
}
