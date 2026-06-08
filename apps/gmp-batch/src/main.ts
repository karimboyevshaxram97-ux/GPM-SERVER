import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { BatchModule } from './batch.module';

async function bootstrap() {
  const app = await NestFactory.create(BatchModule);
  const logger = new Logger('BatchBootstrap');

  const port = process.env.PORT_BATCH || 4000;
  await app.listen(port);

  logger.log(`⚙️  Batch service running on: http://localhost:${port}`);
  logger.log(`⏰  Cron jobs active:`);
  logger.log(`    :00 → batchRollback`);
  logger.log(`    :20 → batchTopAgencies`);
  logger.log(`    :40 → batchTopServices`);
}

bootstrap();
