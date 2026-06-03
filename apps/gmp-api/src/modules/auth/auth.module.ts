import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';

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
  providers: [AuthService, AuthResolver],
})
export class AuthModule {}
