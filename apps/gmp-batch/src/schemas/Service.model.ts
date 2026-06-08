import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({ collection: 'services', timestamps: true, versionKey: false })
export class Service {
  @Prop({ default: 0 })
  currentApplicationCount: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  serviceRank: number;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
