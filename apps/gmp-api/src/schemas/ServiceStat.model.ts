import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ServiceStatDocument = HydratedDocument<ServiceStat>;

@Schema({ versionKey: false })
export class ServiceStat {
  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  service: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  applicationCount: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;
}

export const ServiceStatSchema = SchemaFactory.createForClass(ServiceStat);

ServiceStatSchema.index({ service: 1, date: -1 });
ServiceStatSchema.index({ date: 1 });
