import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApplicationStatus, PaymentStatus } from '../../../common/enums';

export type ApplicationDocument = HydratedDocument<Application>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Application {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  service: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Agency', required: true })
  agency: Types.ObjectId;

  @Prop({ enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status: ApplicationStatus;

  @Prop()
  documents?: string[];

  @Prop()
  notes?: string;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop()
  paymentAmount?: number;

  @Prop()
  paymentDate?: Date;

  @Prop()
  appliedAt: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop()
  priority?: number;

  @Prop({ default: false })
  isReviewEligible: boolean;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

// Indexes
ApplicationSchema.index({ user: 1, createdAt: -1 });
ApplicationSchema.index({ agency: 1, status: 1, createdAt: -1 });
ApplicationSchema.index({ service: 1, status: 1 });
ApplicationSchema.index({ paymentStatus: 1, appliedAt: -1 });
ApplicationSchema.index({ user: 1, status: 1, completedAt: 1 });
ApplicationSchema.index({ status: 1, priority: 1, createdAt: -1 });
