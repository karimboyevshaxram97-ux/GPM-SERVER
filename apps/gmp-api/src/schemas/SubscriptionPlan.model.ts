import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PlanStatus, SupportLevel } from '../libs/enums';

export type SubscriptionPlanDocument = HydratedDocument<SubscriptionPlan>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class SubscriptionPlan {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  monthlyPrice: number;

  @Prop({ required: true })
  annualPrice: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({
    type: [{ name: String, included: Boolean, limit: Number }],
    default: [],
  })
  features: { name: string; included: boolean; limit?: number }[];

  @Prop({ default: 10 })
  maxServices: number;

  @Prop({ default: 5 })
  maxTeamMembers: number;

  @Prop({ default: 100 })
  maxApplicationsPerMonth: number;

  @Prop({ enum: SupportLevel, default: SupportLevel.BASIC })
  supportLevel: SupportLevel;

  @Prop({ default: true })
  isPublic: boolean;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ enum: PlanStatus, default: PlanStatus.ACTIVE })
  status: PlanStatus;
}

export const SubscriptionPlanSchema =
  SchemaFactory.createForClass(SubscriptionPlan);

// slug already indexed via unique: true in @Prop
SubscriptionPlanSchema.index({ status: 1, displayOrder: 1 });
SubscriptionPlanSchema.index({ isPublic: 1, status: 1 });
