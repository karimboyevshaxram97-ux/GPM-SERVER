import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AgencySubscriptionDocument = HydratedDocument<AgencySubscription>;

// gmp-api/src/schemas/AgencySubscription.model.ts ning batch uchun kerakli
// maydonlarigina olingan minimal nusxasi — bir xil 'agencysubscriptions' kolleksiyasi.
@Schema({ collection: 'agencysubscriptions', timestamps: true, versionKey: false })
export class AgencySubscription {
  @Prop({ type: Types.ObjectId, ref: 'Agency', required: true })
  agency: Types.ObjectId;

  @Prop({ default: 'ACTIVE' })
  status: string;

  @Prop({ required: true })
  endDate: Date;
}

export const AgencySubscriptionSchema = SchemaFactory.createForClass(AgencySubscription);
