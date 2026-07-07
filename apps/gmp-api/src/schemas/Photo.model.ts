import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ServiceType } from '../libs/enums';

export type PhotoDocument = HydratedDocument<Photo>;

// Agentlik foto lavhasi: har bir surat bitta yo'nalish (board) ga tegishli.
@Schema({ timestamps: true, versionKey: false })
export class Photo {
  @Prop({ type: Types.ObjectId, ref: 'Agency', required: true })
  agency: Types.ObjectId;

  @Prop({ required: true })
  image: string;

  @Prop({ enum: ServiceType, required: true })
  serviceType: ServiceType;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  commentCount: number;
}

export const PhotoSchema = SchemaFactory.createForClass(Photo);

PhotoSchema.index({ serviceType: 1, likeCount: -1, createdAt: -1 });
PhotoSchema.index({ agency: 1, createdAt: -1 });
