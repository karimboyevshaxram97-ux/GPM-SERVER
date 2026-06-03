import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const env = process.env.NODE_ENV || 'development';
  const devUri = process.env.MONGO_DEV || process.env.MONGODB_URI || '';
  const prodUri = process.env.MONGO_PROD || process.env.MONGODB_URI || '';

  return {
    mongodb: {
      uri: env === 'production' ? prodUri : devUri,
    },
  };
});
