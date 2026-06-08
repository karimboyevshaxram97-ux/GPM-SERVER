import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeedModule } from './seed.module';
import { CountriesSeeder } from './seeders/countries.seeder';
import { SubscriptionPlansSeeder } from './seeders/subscription-plans.seeder';
import { AdminUserSeeder } from './seeders/admin-user.seeder';

async function runSeed() {
  const logger = new Logger('Seeder');
  logger.log('Starting database seed...');

  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    await app.get(CountriesSeeder).seed();
    await app.get(SubscriptionPlansSeeder).seed();
    await app.get(AdminUserSeeder).seed();

    logger.log('Database seeding completed successfully.');
  } catch (err) {
    logger.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runSeed();
