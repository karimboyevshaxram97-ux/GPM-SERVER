import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ConversationStatus } from '../libs/enums';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Conversation {
  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Agency' })
  agency?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage?: Types.ObjectId;

  @Prop()
  lastMessageAt?: Date;

  @Prop({ type: Map, of: Number, default: {} })
  unreadCountByUser: Map<string, number>;

  @Prop({ enum: ConversationStatus, default: ConversationStatus.ACTIVE })
  status: ConversationStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  blockedBy?: Types.ObjectId;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ participants: 1, lastMessageAt: -1 });
ConversationSchema.index({ agency: 1, lastMessageAt: -1 });
ConversationSchema.index({ participants: 1, status: 1 });
