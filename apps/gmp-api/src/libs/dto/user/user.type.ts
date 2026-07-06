import { ObjectType, Field, ID } from '@nestjs/graphql';
import { AuthProvider, Lang, UserRole, UserStatus } from '../../enums';

@ObjectType()
export class UserType {
  @Field(() => ID)
  _id: string;

  @Field()
  firstName: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  email?: string;

  @Field(() => AuthProvider)
  authProvider: AuthProvider;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  dateOfBirth?: Date;

  @Field({ nullable: true })
  nationality?: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => UserStatus)
  status: UserStatus;

  @Field(() => Lang)
  preferredLanguage: Lang;

  @Field()
  emailVerified: boolean;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
