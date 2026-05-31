import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  mongodb: {
    uri: process.env.MONGODB_URI || '',
  },
}));
