import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { GqlJwtAuthGuard } from './guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from './guards/gql-roles.guard';
import { WithoutGuard } from './guards/without.guard';

@Module({
  imports: [UserModule],
  providers: [AuthService, AuthResolver, GqlJwtAuthGuard, GqlRolesGuard, WithoutGuard],
  exports: [AuthService, GqlJwtAuthGuard, GqlRolesGuard, WithoutGuard],
})
export class AuthModule {}
