import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true, versionKey: false })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  adminId: Types.ObjectId;

  @Prop({ required: true })
  action: string; // e.g. BAN_USER, APPROVE_AGENCY, DELETE_USER

  @Prop({ required: true })
  targetType: string; // USER | AGENCY

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop()
  targetName?: string;

  @Prop()
  reason?: string;

  @Prop({ type: Object })
  meta?: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
