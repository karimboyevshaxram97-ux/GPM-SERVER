import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { AuthController } from './auth.controller';
import { OAuthStateService } from './oauth-state.service';
import { OAuthExceptionFilter } from './filters/oauth-exception.filter';
import { GoogleStrategy } from './strategies/google.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { GqlJwtAuthGuard } from './guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from './guards/gql-roles.guard';
import { WithoutGuard } from './guards/without.guard';

@Module({
  imports: [UserModule, PassportModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthResolver,
    OAuthStateService,
    OAuthExceptionFilter,
    GoogleStrategy,
    KakaoStrategy,
    NaverStrategy,
    GqlJwtAuthGuard,
    GqlRolesGuard,
    WithoutGuard,
  ],
  exports: [AuthService, GqlJwtAuthGuard, GqlRolesGuard, WithoutGuard],
})
export class AuthModule {}
