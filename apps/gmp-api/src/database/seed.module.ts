import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import databaseConfig from '../libs/config/database.config';
import { Country, CountrySchema } from '../schemas/Country.model';
import { SubscriptionPlan, SubscriptionPlanSchema } from '../schemas/SubscriptionPlan.model';
import { User, UserSchema } from '../schemas/User.model';

import { CountriesSeeder } from './seeders/countries.seeder';
import { SubscriptionPlansSeeder } from './seeders/subscription-plans.seeder';
import { AdminUserSeeder } from './seeders/admin-user.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
      load: [databaseConfig],
    }),

    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        let uri = configService.get<string>('database.mongodb.uri');
        if (!uri) {
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
