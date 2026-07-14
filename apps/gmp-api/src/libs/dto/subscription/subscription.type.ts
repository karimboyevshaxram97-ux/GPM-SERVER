import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import {
  PlanStatus,
  SupportLevel,
  SubscriptionStatus,
  BillingCycle,
} from '../../enums';

@ObjectType()
export class PlanFeatureType {
  @Field()
  name: string;

  @Field()
  included: boolean;

  @Field(() => Int, { nullable: true })
  limit?: number;
}

@ObjectType()
export class SubscriptionPlanType {
  @Field(() => ID)
  _id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  monthlyPrice: number;

  @Field(() => Float)
  annualPrice: number;

  @Field()
  currency: string;

  @Field(() => [PlanFeatureType])
  features: PlanFeatureType[];

  @Field(() => Int)
  maxServices: number;

  @Field(() => Int)
  maxTeamMembers: number;

  @Field(() => Int)
  maxApplicationsPerMonth: number;

  @Field(() => SupportLevel)
  supportLevel: SupportLevel;

  @Field()
  isPublic: boolean;

  @Field(() => Int)
  displayOrder: number;

  @Field(() => PlanStatus)
  status: PlanStatus;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PaymentHistoryType {
  @Field(() => Float)
  amount: number;

  @Field()
  status: string;

  @Field()
  paidAt: Date;

  @Field({ nullable: true })
  receiptUrl?: string;
}

@ObjectType()
export class AgencySubscriptionType {
  @Field(() => ID)
  _id: string;

  @Field()
  agency: string;

  @Field()
  plan: string;

  @Field(() => SubscriptionStatus)
  status: SubscriptionStatus;

  @Field({ nullable: true })
  stripeSubscriptionId?: string;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field({ nullable: true })
  renewalDate?: Date;

  @Field({ nullable: true })
  cancelledAt?: Date;

  @Field(() => BillingCycle)
  billingCycle: BillingCycle;

  @Field()
  autoRenew: boolean;

  @Field(() => [PaymentHistoryType])
  paymentHistory: PaymentHistoryType[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
