import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ReviewStatus } from '../../../common/enums/review.enum';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Agency', required: true })
  agency: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service' })
  service?: Types.ObjectId;

  @Prop({ enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ agency: 1, user: 1, createdAt: -1 });
