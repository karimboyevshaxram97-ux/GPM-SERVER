import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  // Mongoose'ning o'zi "type" kalitini SchemaType deb talqin qiladi — ichki maydon
  // ham "type" deb nomlangani uchun uni { type: String } bilan o'rab, subhujjat
  // maydoni ekanini aniq ko'rsatamiz (aks holda butun massiv jimgina [String]
  // sifatida ro'yxatdan o'tib, "Cast to [string] failed" xatosini beradi — PhotoComment
  // izohlariga attachment qo'shishda aynan shu xato aniqlangan edi, bu yerda ham
  // xuddi shu naqsh mavjud edi, faqat hali hech kim ishlatmagani uchun bilinmagan).
  @Prop({ type: [{ url: String, type: { type: String }, name: String }], default: [] })
  attachments: { url: string; type: string; name: string }[];

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop()
  editedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });
MessageSchema.index({ conversation: 1, isRead: 1, createdAt: -1 });
