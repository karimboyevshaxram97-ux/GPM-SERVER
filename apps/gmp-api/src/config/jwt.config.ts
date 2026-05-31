import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRATION || '3600',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-change-in-production',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '604800',
}));
