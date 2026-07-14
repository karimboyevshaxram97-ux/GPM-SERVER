import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ViewTargetType } from '../libs/enums';

export type ViewDocument = HydratedDocument<View>;

@Schema({ timestamps: true, versionKey: false })
export class View {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  viewer?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop({ enum: ViewTargetType, required: true })
  targetType: ViewTargetType;

  // Kalendar kun bo'yicha (YYYY-MM-DD) dedup bucket — bitta registered viewer bir
  // targetni bir kunda faqat bitta marta "ko'rgan" hisoblanadi, ertasi kuni yana sanaladi.
  @Prop()
  viewDate?: string;
}

export const ViewSchema = SchemaFactory.createForClass(View);

// Registered foydalanuvchi uchun bir kunda bitta target'ga bitta view — partial index
// faqat viewer mavjud hujjatlarga tegishli, shuning uchun anonim view'lar (viewer yo'q)
// hech qachon bu cheklovga tortilmaydi va dedup qilinmaydi.
ViewSchema.index(
  { viewer: 1, targetId: 1, targetType: 1, viewDate: 1 },
  { unique: true, partialFilterExpression: { viewer: { $exists: true } } },
);
ViewSchema.index({ targetId: 1, targetType: 1 });
ViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // auto-purge after 90 days
