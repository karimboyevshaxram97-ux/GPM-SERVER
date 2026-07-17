import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  app.useWebSocketAdapter(new WsAdapter(app));

  // /uploads/filename.webp → uploads/ papkasidan serve qilish
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // Enable CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001'];
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const localDevelopmentOrigin =
    /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;

  app.enableCors({
    origin: (origin, callback) => {
      const isAllowed =
        !origin ||
        allowedOrigins.includes(origin) ||
        (isDevelopment && localDevelopmentOrigin.test(origin));

      callback(
        isAllowed ? null : new Error(`CORS origin is not allowed: ${origin}`),
        isAllowed,
      );
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT_API || process.env.PORT || 3007;
  await app.listen(port);

  logger.log(`Application is running on port ${port}`);
  logger.log(`GraphQL endpoint: /graphql`);
}

bootstrap();
