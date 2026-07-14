import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PhotoCommentDocument = HydratedDocument<PhotoComment>;

@Schema({ timestamps: true, versionKey: false })
export class PhotoComment {
  @Prop({ type: Types.ObjectId, ref: 'Photo', required: true })
  photo: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  // Faqat matnli, faqat attachment'li yoki ikkalasi bilan izoh qoldirish mumkin —
  // shuning uchun majburiy emas (kamida bittasi photo.service.ts'da tekshiriladi).
  @Prop({ trim: true, maxlength: 500 })
  text?: string;

  // Mongoose'ning o'zi "type" kalitini SchemaType deb talqin qiladi — ichki maydon
  // ham "type" deb nomlangani uchun uni { type: String } bilan o'rab, subhujjat
  // maydoni ekanini aniq ko'rsatamiz (aks holda butun massiv jimgina [String]
  // sifatida ro'yxatdan o'tib, "Cast to [string] failed" xatosini beradi).
  @Prop({ type: [{ url: String, type: { type: String }, name: String }], default: [] })
  attachments: { url: string; type: string; name: string }[];
}

export const PhotoCommentSchema = SchemaFactory.createForClass(PhotoComment);

PhotoCommentSchema.index({ photo: 1, createdAt: -1 });
