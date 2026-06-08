import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AgencyStatDocument = HydratedDocument<AgencyStat>;

@Schema({ versionKey: false })
export class AgencyStat {
  @Prop({ type: Types.ObjectId, ref: 'Agency', required: true })
  agency: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: 0 })
  profileViews: number;

  @Prop({ default: 0 })
  applicationCount: number;

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: 0 })
  followerCount: number;

  @Prop({ default: 0 })
  activeServices: number;
}

export const AgencyStatSchema = SchemaFactory.createForClass(AgencyStat);

AgencyStatSchema.index({ agency: 1, date: -1 });
AgencyStatSchema.index({ date: 1 });
