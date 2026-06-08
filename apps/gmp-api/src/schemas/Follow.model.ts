import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FollowDocument = HydratedDocument<Follow>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Follow {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Agency', required: true })
  agency: Types.ObjectId;

  @Prop({ default: true })
  notificationsEnabled: boolean;

  @Prop({ default: Date.now })
  followedAt: Date;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);

FollowSchema.index({ user: 1, agency: 1 }, { unique: true });
FollowSchema.index({ user: 1, followedAt: -1 });
FollowSchema.index({ agency: 1, followedAt: -1 });
FollowSchema.index({ agency: 1, notificationsEnabled: 1 });
