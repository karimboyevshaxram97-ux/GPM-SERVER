import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Message } from '../../../libs';

// OAuth flows happen in browser redirects, so errors must land the user back on
// the frontend instead of returning a JSON error from the API domain.
@Catch()
export class OAuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const frontendUrl = this.configService.get<string>('oauth.frontendUrl') ?? 'http://localhost:3000';

    const message =
      exception instanceof HttpException ? exception.message : Message.SOCIAL_LOGIN_FAILED;
    this.logger.warn(`Social login failed: ${(exception as Error)?.message ?? exception}`);

    const url = new URL('/auth/callback', frontendUrl);
    url.searchParams.set('error', message);
    res.redirect(url.toString());
  }
}
