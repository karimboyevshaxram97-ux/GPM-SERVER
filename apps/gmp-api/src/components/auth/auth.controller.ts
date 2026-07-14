import {
  Controller,
  Get,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { SocialProfile } from '../../libs';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { OAuthExceptionFilter } from './filters/oauth-exception.filter';
import {
  GoogleAuthGuard,
  KakaoAuthGuard,
  NaverAuthGuard,
} from './guards/social-auth.guard';

// OAuth redirects cannot go through GraphQL, so social login lives on REST routes:
//   GET /auth/{provider}           → redirect the browser to the provider
//   GET /auth/{provider}/callback  → exchange code, then redirect to the frontend with tokens
@Public()
@UseFilters(OAuthExceptionFilter)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    console.log('GET: /auth/google/callback');
    return this.completeSocialLogin(req, res);
  }

  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  kakaoAuth(): void {
    // Guard redirects to Kakao
  }

  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  async kakaoCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    console.log('GET: /auth/kakao/callback');
    return this.completeSocialLogin(req, res);
  }

  @Get('naver')
  @UseGuards(NaverAuthGuard)
  naverAuth(): void {
    // Guard redirects to Naver
  }

  @Get('naver/callback')
  @UseGuards(NaverAuthGuard)
  async naverCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    console.log('GET: /auth/naver/callback');
    return this.completeSocialLogin(req, res);
  }

  private async completeSocialLogin(
    req: Request,
    res: Response,
  ): Promise<void> {
    const result = await this.authService.socialLogin(
      req.user as SocialProfile,
    );

    const frontendUrl =
      this.configService.get<string>('oauth.frontendUrl') ??
      'http://localhost:3000';
    const url = new URL('/auth/callback', frontendUrl);
    url.searchParams.set('accessToken', result.accessToken);
    url.searchParams.set('refreshToken', result.refreshToken);
    res.redirect(url.toString());
  }
}
