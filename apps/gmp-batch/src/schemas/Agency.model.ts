import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AgencyDocument = HydratedDocument<Agency>;

@Schema({ collection: 'agencies', timestamps: true, versionKey: false })
export class Agency {
  @Prop({ default: 0 })
  totalServices: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  agencyRank: number;
}

export const AgencySchema = SchemaFactory.createForClass(Agency);
