import { registerAs } from '@nestjs/config';

const getRequiredSecret = (value: string | undefined, name: string, fallback: string): string => {
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be set in production`);
  }
  return fallback;
};

export default registerAs('jwt', () => ({
  secret: getRequiredSecret(
    process.env.SECRET_TOKEN || process.env.JWT_SECRET,
    'SECRET_TOKEN or JWT_SECRET',
    'super-secret-key-change-in-production',
  ),
  expiresIn: parseInt(process.env.JWT_EXPIRATION || '3600', 10),
  refreshSecret: getRequiredSecret(
    process.env.JWT_REFRESH_SECRET || process.env.SECRET_TOKEN,
    'JWT_REFRESH_SECRET or SECRET_TOKEN',
    'super-secret-refresh-key-change-in-production',
  ),
  refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRATION || '604800', 10),
}));
