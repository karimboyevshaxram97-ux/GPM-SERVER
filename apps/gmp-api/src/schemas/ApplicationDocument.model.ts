import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  ApplicationDocumentKind,
  ApplicationDocumentStatus,
} from '../libs/enums';

export type ApplicationDocumentRecord = HydratedDocument<ApplicationDocument>;

@Schema({ timestamps: true, versionKey: false })
export class ApplicationDocument {
  @Prop({
    type: Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true,
  })
  application: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Agency', required: true, index: true })
  agency: Types.ObjectId;

  @Prop({ enum: ApplicationDocumentKind, required: true })
  kind: ApplicationDocumentKind;

  @Prop({ required: true, trim: true, maxlength: 120 })
  label: string;

  @Prop({ default: true })
  required: boolean;

  @Prop({
    enum: ApplicationDocumentStatus,
    default: ApplicationDocumentStatus.REQUESTED,
  })
  status: ApplicationDocumentStatus;

  @Prop()
  originalName?: string;

  @Prop()
  storedName?: string;

  @Prop()
  mimeType?: string;

  @Prop()
  size?: number;

  @Prop()
  rejectionReason?: string;

  @Prop()
  uploadedAt?: Date;

  @Prop()
  reviewedAt?: Date;
}

export const ApplicationDocumentSchema =
  SchemaFactory.createForClass(ApplicationDocument);
ApplicationDocumentSchema.index({ application: 1, createdAt: 1 });
ApplicationDocumentSchema.index({ agency: 1, status: 1, updatedAt: -1 });
