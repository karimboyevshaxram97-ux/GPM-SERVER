import { NestFactory } from '@nestjs/core';
import { BatchModule } from './batch.module';

async function bootstrap() {
  const app = await NestFactory.create(BatchModule);
  const port = process.env.PORT_BATCH || 4000;
  await app.listen(port);
}

bootstrap();
