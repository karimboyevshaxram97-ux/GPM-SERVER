import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthProvider, SocialProfile } from '../../../libs';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    // Placeholder credentials keep the app booting when the provider is not
    // configured; the guard blocks the routes in that case.
    super({
      clientID:
        configService.get<string>('oauth.google.clientId') || 'not-configured',
      clientSecret:
        configService.get<string>('oauth.google.clientSecret') ||
        'not-configured',
      callbackURL: configService.get<string>('oauth.google.callbackUrl'),
      scope: ['profile', 'email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): SocialProfile {
    return {
      provider: AuthProvider.GOOGLE,
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
