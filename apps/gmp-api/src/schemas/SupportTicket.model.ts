import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SupportTicketStatus } from '../libs/enums';

export type SupportTicketDocument = HydratedDocument<SupportTicket>;

@Schema({ timestamps: true, versionKey: false })
export class SupportTicket {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ trim: true })
  phoneNumber?: string;

  @Prop({ trim: true })
  role?: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ enum: SupportTicketStatus, default: SupportTicketStatus.OPEN })
  status: SupportTicketStatus;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);

SupportTicketSchema.index({ status: 1, createdAt: -1 });
SupportTicketSchema.index({ email: 1, createdAt: -1 });
