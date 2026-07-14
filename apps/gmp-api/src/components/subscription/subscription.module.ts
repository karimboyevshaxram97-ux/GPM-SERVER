import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from '../../schemas/SubscriptionPlan.model';
import {
  AgencySubscription,
  AgencySubscriptionSchema,
} from '../../schemas/AgencySubscription.model';
import { Agency, AgencySchema } from '../../schemas/Agency.model';
import { SubscriptionService } from './subscription.service';
import { SubscriptionResolver } from './subscription.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: AgencySubscription.name, schema: AgencySubscriptionSchema },
      { name: Agency.name, schema: AgencySchema },
    ]),
  ],
  providers: [SubscriptionService, SubscriptionResolver],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
