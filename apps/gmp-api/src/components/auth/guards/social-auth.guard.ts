import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Message } from '../../../libs';
import { OAuthStateService } from '../oauth-state.service';

type OAuthProvider = 'google' | 'kakao' | 'naver';

// A callback request carries the provider's response; the initiate request does not.
const isCallbackRequest = (req: any): boolean =>
  Boolean(req.query?.code || req.query?.error || req.query?.state);

// Shared pre-checks for all social providers:
// - 503 when the provider credentials are missing from env
// - callback: verify the signed `state` param (CSRF) before exchanging the code
const assertSocialRequestAllowed = (
  provider: OAuthProvider,
  configService: ConfigService,
  oauthStateService: OAuthStateService,
  req: any,
): void => {
  if (!configService.get<string>(`oauth.${provider}.clientId`)) {
    throw new ServiceUnavailableException(Message.PROVIDER_NOT_CONFIGURED);
  }
  if (isCallbackRequest(req) && !oauthStateService.validate(req.query?.state)) {
    throw new UnauthorizedException(Message.SOCIAL_LOGIN_FAILED);
  }
};

// On the initiate request, attach a signed `state` param the callback can verify.
const socialAuthenticateOptions = (
  oauthStateService: OAuthStateService,
  req: any,
): Record<string, any> | undefined =>
  isCallbackRequest(req) ? undefined : { state: oauthStateService.generate() };

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthStateService: OAuthStateService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    assertSocialRequestAllowed(
      'google',
      this.configService,
      this.oauthStateService,
      req,
    );
    return (await super.canActivate(context)) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    return socialAuthenticateOptions(
      this.oauthStateService,
      context.switchToHttp().getRequest(),
    );
  }
}

@Injectable()
export class KakaoAuthGuard extends AuthGuard('kakao') {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthStateService: OAuthStateService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    assertSocialRequestAllowed(
      'kakao',
      this.configService,
      this.oauthStateService,
      req,
    );
    return (await super.canActivate(context)) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    return socialAuthenticateOptions(
      this.oauthStateService,
      context.switchToHttp().getRequest(),
    );
  }
}

@Injectable()
export class NaverAuthGuard extends AuthGuard('naver') {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthStateService: OAuthStateService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    assertSocialRequestAllowed(
      'naver',
      this.configService,
      this.oauthStateService,
      req,
    );
    return (await super.canActivate(context)) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    return socialAuthenticateOptions(
      this.oauthStateService,
      context.switchToHttp().getRequest(),
    );
  }
}
