import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PhotoCommentDocument = HydratedDocument<PhotoComment>;

@Schema({ timestamps: true, versionKey: false })
export class PhotoComment {
  @Prop({ type: Types.ObjectId, ref: 'Photo', required: true })
  photo: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 500 })
  text: string;
}

export const PhotoCommentSchema = SchemaFactory.createForClass(PhotoComment);

PhotoCommentSchema.index({ photo: 1, createdAt: -1 });
