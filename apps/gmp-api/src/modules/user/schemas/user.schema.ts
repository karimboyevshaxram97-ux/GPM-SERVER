import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole, UserStatus } from '../../../common/enums/user.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    sparse: true,
  })
  email: string;

  @Prop({
    required: true,
    select: false, // Exclude from queries by default
  })
  password: string;

  @Prop({ select: false })
  refreshTokenHash?: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  avatar?: string;

  @Prop()
  bio?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  nationality?: string;

  @Prop({ enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ status: 1, createdAt: -1 });
UserSchema.index({ nationality: 1 });
