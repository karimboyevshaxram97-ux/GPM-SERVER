import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ServiceStatus, ServiceType, ServiceVisibility } from '../libs/enums';
import {
  LocalizedString,
  LocalizedStringSchema,
} from '../libs/types/localized-string.schema';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Service {
  @Prop({ type: LocalizedStringSchema, required: true })
  name: LocalizedString;

  @Prop({ type: LocalizedStringSchema })
  description?: LocalizedString;

  @Prop([String])
  keywords: string[];

  @Prop({ type: Types.ObjectId, ref: 'Agency', required: true })
  agency: Types.ObjectId;

  @Prop({ enum: ServiceType, required: true })
  serviceType: ServiceType;

  @Prop({ required: true })
  destinationCountry: string;

  @Prop([String])
  sourceCountries: string[];

  @Prop()
  price?: number;

  @Prop()
  processingTime?: string;

  @Prop()
  requirements?: string;

  @Prop({ enum: ServiceStatus, default: ServiceStatus.ACTIVE })
  status: ServiceStatus;

  @Prop({ enum: ServiceVisibility, default: ServiceVisibility.PUBLIC })
  visibility: ServiceVisibility;

  @Prop({ default: 0 })
  currentApplicationCount: number;

  @Prop()
  maxApplicationCount?: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ default: 0 })
  serviceRank: number;

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop([String])
  tags: string[];

  @Prop([String])
  documents?: string[];

  @Prop()
  image?: string;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

// Indexes
ServiceSchema.index({
  'name.uz': 'text',
  'name.ru': 'text',
  'name.en': 'text',
  'name.ko': 'text',
  'description.uz': 'text',
  'description.ru': 'text',
  'description.en': 'text',
  'description.ko': 'text',
  keywords: 'text',
});
ServiceSchema.index({
  serviceType: 1,
  destinationCountry: 1,
  visibility: 1,
  status: 1,
});
ServiceSchema.index({ agency: 1, status: 1 });
ServiceSchema.index({
  destinationCountry: 1,
  averageRating: -1,
  totalReviews: -1,
});
ServiceSchema.index({ sourceCountries: 1 });
ServiceSchema.index({ createdAt: -1 });
ServiceSchema.index({ tags: 1 });
ServiceSchema.index({ status: 1, currentApplicationCount: 1 });
