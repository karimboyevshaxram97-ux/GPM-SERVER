import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import databaseConfig from '../libs/config/database.config';
import { getEnvFilePaths } from '../libs/config/env-paths';
import { Country, CountrySchema } from '../schemas/Country.model';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from '../schemas/SubscriptionPlan.model';
import { User, UserSchema } from '../schemas/User.model';

import { CountriesSeeder } from './seeders/countries.seeder';
import { SubscriptionPlansSeeder } from './seeders/subscription-plans.seeder';
import { AdminUserSeeder } from './seeders/admin-user.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvFilePaths(),
      load: [databaseConfig],
    }),

    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        let uri = configService.get<string>('database.mongodb.uri');
        const allowInMemory =
          process.env.NODE_ENV !== 'production' &&
          /^(1|true|yes)$/i.test(process.env.ALLOW_IN_MEMORY_MONGO ?? '');

        if (!uri) {
          if (!allowInMemory) {
            throw new Error(
              'MongoDB URI must be set before running seed. Set ALLOW_IN_MEMORY_MONGO=true only for disposable local demos/tests.',
            );
          }
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          const mongod = await MongoMemoryServer.create();
          uri = mongod.getUri();
        }
        return { uri, autoCreate: true };
      },
      inject: [ConfigService],
    }),

    MongooseModule.forFeature([
      { name: Country.name, schema: CountrySchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [CountriesSeeder, SubscriptionPlansSeeder, AdminUserSeeder],
})
export class SeedModule {}
