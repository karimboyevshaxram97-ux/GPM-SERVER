import { registerAs } from '@nestjs/config';

const apiUrl = () => process.env.API_URL || 'http://localhost:3007';

export default registerAs('oauth', () => ({
  // Where users land after the OAuth dance (frontend route that stores the tokens)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  // Secret used to sign the OAuth `state` parameter (CSRF protection)
  stateSecret:
    process.env.OAUTH_STATE_SECRET ||
    process.env.SECRET_TOKEN ||
    process.env.JWT_SECRET ||
    'oauth-state-secret-change-in-production',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || `${apiUrl()}/auth/google/callback`,
  },
  kakao: {
    clientId: process.env.KAKAO_CLIENT_ID || '',
    clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
    callbackUrl: process.env.KAKAO_CALLBACK_URL || `${apiUrl()}/auth/kakao/callback`,
  },
  naver: {
    clientId: process.env.NAVER_CLIENT_ID || '',
    clientSecret: process.env.NAVER_CLIENT_SECRET || '',
    callbackUrl: process.env.NAVER_CALLBACK_URL || `${apiUrl()}/auth/naver/callback`,
  },
}));
