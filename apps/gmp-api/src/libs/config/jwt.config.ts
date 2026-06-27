import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.SECRET_TOKEN || process.env.JWT_SECRET || 'super-secret-key-change-in-production',
  expiresIn: parseInt(process.env.JWT_EXPIRATION || '3600', 10),
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || process.env.SECRET_TOKEN || 'super-secret-refresh-key-change-in-production',
  refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRATION || '604800', 10),
}));
