import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SubscriptionStatus, BillingCycle, PaymentStatus } from '../libs/enums';

export type AgencySubscriptionDocument = HydratedDocument<AgencySubscription>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class AgencySubscription {
  @Prop({ type: Types.ObjectId, ref: 'Agency', required: true })
  agency: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubscriptionPlan', required: true })
  plan: Types.ObjectId;

  @Prop({ enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Prop()
  stripeSubscriptionId?: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  renewalDate?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop({ enum: BillingCycle, default: BillingCycle.MONTHLY })
  billingCycle: BillingCycle;

  @Prop({ default: true })
  autoRenew: boolean;

  @Prop({
    type: [{ amount: Number, status: String, paidAt: Date, receiptUrl: String }],
    default: [],
  })
  paymentHistory: { amount: number; status: PaymentStatus; paidAt: Date; receiptUrl?: string }[];
}

export const AgencySubscriptionSchema = SchemaFactory.createForClass(AgencySubscription);

AgencySubscriptionSchema.index({ agency: 1, status: 1 });
AgencySubscriptionSchema.index({ status: 1, renewalDate: 1 });
AgencySubscriptionSchema.index({ agency: 1, createdAt: -1 });
