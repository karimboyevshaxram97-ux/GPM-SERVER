import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  AgencyStatus,
  AgencyVerificationStatus,
  SubscriptionStatus,
} from '../libs/enums';
import {
  LocalizedString,
  LocalizedStringSchema,
} from '../libs/types/localized-string.schema';

export type AgencyDocument = HydratedDocument<Agency>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Agency {
  @Prop({ type: LocalizedStringSchema, required: true })
  name: LocalizedString;

  @Prop({ unique: true, lowercase: true, sparse: true })
  slug: string;

  @Prop({ type: LocalizedStringSchema })
  description?: LocalizedString;

  @Prop()
  logo?: string;

  @Prop()
  coverImage?: string;

  @Prop()
  website?: string;

  @Prop()
  email: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  country?: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop([String])
  operatingCountries: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  owner: Types.ObjectId;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  admins: Types.ObjectId[];

  @Prop({ enum: AgencyStatus, default: AgencyStatus.ACTIVE })
  status: AgencyStatus;

  @Prop({
    enum: AgencyVerificationStatus,
    default: AgencyVerificationStatus.PENDING,
  })
  verificationStatus: AgencyVerificationStatus;

  @Prop()
  verificationDate?: Date;

  @Prop({ enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  subscriptionStatus: SubscriptionStatus;

  @Prop({ type: Types.ObjectId })
  activeSubscription?: Types.ObjectId;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  totalServices: number;

  @Prop({ default: 0 })
  agencyRank: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop()
  taxId?: string;

  @Prop()
  registrationNumber?: string;

  @Prop()
  legalRepresentative?: string;
}

export const AgencySchema = SchemaFactory.createForClass(Agency);

// Indexes
AgencySchema.index({ verificationStatus: 1, createdAt: -1 });
AgencySchema.index({ operatingCountries: 1 });
AgencySchema.index({ subscriptionStatus: 1, activeSubscription: 1 });
AgencySchema.index({ status: 1, createdAt: -1 });
AgencySchema.index({ averageRating: -1, totalReviews: -1 });
AgencySchema.index({ latitude: 1, longitude: 1 }, { sparse: true });
