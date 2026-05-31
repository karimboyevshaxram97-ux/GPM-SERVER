import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserRole, UserStatus } from '../../../common/enums/user.enum';

@ObjectType()
export class UserType {
  @Field(() => ID)
  _id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

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

  @Field()
  emailVerified: boolean;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
