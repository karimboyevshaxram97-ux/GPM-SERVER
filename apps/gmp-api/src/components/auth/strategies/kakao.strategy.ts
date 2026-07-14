import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { AuthProvider, SocialProfile } from '../../../libs';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(configService: ConfigService) {
    super({
      clientID:
        configService.get<string>('oauth.kakao.clientId') || 'not-configured',
      // Kakao client secret is optional (enabled separately in the Kakao console)
      clientSecret: configService.get<string>('oauth.kakao.clientSecret') || '',
      callbackURL:
        configService.get<string>('oauth.kakao.callbackUrl') ||
        'http://localhost:3007/auth/kakao/callback',
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): SocialProfile {
    const account = profile._json?.kakao_account;
    // Kakao returns the email only when the user consented; trust it only when
    // Kakao itself marks it valid and verified.
    const email =
      account?.email &&
      account?.is_email_valid !== false &&
      account?.is_email_verified !== false
        ? account.email
        : undefined;

    return {
      provider: AuthProvider.KAKAO,
      providerId: String(profile.id),
      email,
      name:
        account?.profile?.nickname || profile.displayName || profile.username,
      avatarUrl:
        account?.profile?.profile_image_url ||
        profile._json?.properties?.profile_image,
    };
  }
}
