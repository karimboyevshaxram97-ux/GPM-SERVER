import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ReviewStatus } from '../libs/enums/review.enum';

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

// Sharh REJECTED/HIDDEN qilinsa, foydalanuvchi qayta sharh qoldira olishi kerak —
// unique cheklov faqat hali "amaldagi" (kutilayotgan yoki tasdiqlangan) sharhga tegishli.
export const BLOCKING_REVIEW_STATUSES = [
  ReviewStatus.PENDING,
  ReviewStatus.APPROVED,
];

ReviewSchema.index(
  { agency: 1, user: 1, service: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: BLOCKING_REVIEW_STATUSES } },
  },
);
ReviewSchema.index({ agency: 1, user: 1, createdAt: -1 });
