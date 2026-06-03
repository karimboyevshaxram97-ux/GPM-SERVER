import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth-response.type';
import { CreateUserInput } from '../user/dto/create-user.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResponse, { name: 'register' })
  async register(@Args('input') input: CreateUserInput): Promise<AuthResponse> {
    return this.authService.register(input);
  }
}
