import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-naver-v2';
import { AuthProvider, SocialProfile } from '../../../libs';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('oauth.naver.clientId') || 'not-configured',
      clientSecret: configService.get<string>('oauth.naver.clientSecret') || 'not-configured',
      callbackURL: configService.get<string>('oauth.naver.callbackUrl'),
    });
  }

  validate(accessToken: string, refreshToken: string, profile: Profile): SocialProfile {
    return {
      provider: AuthProvider.NAVER,
      providerId: profile.id,
      email: profile.email,
      name: profile.name || profile.nickname,
      avatarUrl: profile.profileImage,
    };
  }
}
