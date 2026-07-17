import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AuthProvider, UserRole, UserStatus } from '../libs/enums/user.enum';
import { Lang } from '../libs/enums/lang.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({ required: true })
  firstName: string;

  // Optional: social profiles (e.g. Kakao) may only provide a single display name
  @Prop()
  lastName?: string;

  // Optional: Kakao may not return an email if the user did not consent
  @Prop({
    unique: true,
    lowercase: true,
    sparse: true,
  })
  email?: string;

  // Optional: social-login users have no local password
  @Prop({
    select: false, // Exclude from queries by default
  })
  password?: string;

  @Prop({ type: String, enum: AuthProvider, default: AuthProvider.EMAIL })
  authProvider: AuthProvider;

  // Provider-issued unique id (only for social accounts)
  @Prop()
  providerId?: string;

  @Prop({ select: false })
  refreshTokenHash?: string;

  @Prop({ unique: true, sparse: true })
  phoneNumber?: string;

  @Prop()
  avatar?: string;

  @Prop()
  bio?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  nationality?: string;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: String, enum: Lang, default: Lang.UZ })
  preferredLanguage: Lang;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// email already indexed via unique: true in @Prop
UserSchema.index({ status: 1, createdAt: -1 });
UserSchema.index({ nationality: 1 });
UserSchema.index(
  { authProvider: 1, providerId: 1 },
  { unique: true, partialFilterExpression: { providerId: { $exists: true } } },
);
