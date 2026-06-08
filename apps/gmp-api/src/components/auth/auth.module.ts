import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { GqlJwtAuthGuard } from './guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from './guards/gql-roles.guard';
import { WithoutGuard } from './guards/without.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.refreshSecret'),
        signOptions: {
          expiresIn: configService.get('jwt.refreshExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
  ],
  providers: [AuthService, AuthResolver, GqlJwtAuthGuard, GqlRolesGuard, WithoutGuard],
  exports: [AuthService, GqlJwtAuthGuard, GqlRolesGuard, WithoutGuard],
})
export class AuthModule {}
