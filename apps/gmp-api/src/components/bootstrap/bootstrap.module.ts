import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BootstrapService } from './bootstrap.service';
import { Country, CountrySchema } from '../../schemas/Country.model';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from '../../schemas/SubscriptionPlan.model';
import { CountriesSeeder } from '../../database/seeders/countries.seeder';
import { SubscriptionPlansSeeder } from '../../database/seeders/subscription-plans.seeder';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Country.name, schema: CountrySchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
    ]),
  ],
  providers: [BootstrapService, CountriesSeeder, SubscriptionPlansSeeder],
})
export class BootstrapModule {}
