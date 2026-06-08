import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { LikeTargetType } from '../libs/enums';

export type LikeDocument = HydratedDocument<Like>;

@Schema({ timestamps: true, versionKey: false })
export class Like {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop({ enum: LikeTargetType, required: true })
  targetType: LikeTargetType;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true });
LikeSchema.index({ targetId: 1, targetType: 1 });
