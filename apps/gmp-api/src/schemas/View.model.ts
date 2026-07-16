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

  // Oldingi kunlik dedup yozuvlari bilan backward compatibility uchun saqlanadi.
  // Yangi view'larda ishlatilmaydi: registered viewer target uchun umrbod bir marta sanaladi.
  @Prop()
  viewDate?: string;
}

export const ViewSchema = SchemaFactory.createForClass(View);

// Legacy kunlik unique index yangi hujjatlarda viewDate bo'lmagani sabab parallel
// upsertlarni ham himoya qiladi. Service filtri viewDate'ni hisobga olmaydi, shuning
// uchun registered foydalanuvchi keyingi kunlarda ham qayta sanalmaydi.
ViewSchema.index(
  { viewer: 1, targetId: 1, targetType: 1, viewDate: 1 },
  { unique: true, partialFilterExpression: { viewer: { $exists: true } } },
);
ViewSchema.index({ viewer: 1, targetId: 1, targetType: 1 });
ViewSchema.index({ targetId: 1, targetType: 1 });
ViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // auto-purge after 90 days
