import { ObjectType, Field, ID } from '@nestjs/graphql';
import { AgencyStatus, AgencyVerificationStatus, SubscriptionStatus } from '../../enums';

@ObjectType()
export class AgencyType {
  @Field(() => ID)
  _id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  logo?: string;

  @Field({ nullable: true })
  website?: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field(() => [String])
  operatingCountries: string[];

  @Field()
  owner: string;

  @Field(() => [String])
  admins: string[];

  @Field(() => AgencyStatus)
  status: AgencyStatus;

  @Field(() => AgencyVerificationStatus)
  verificationStatus: AgencyVerificationStatus;

  @Field(() => SubscriptionStatus)
  subscriptionStatus: SubscriptionStatus;

  @Field()
  totalReviews: number;

  @Field()
  averageRating: number;

  @Field()
  totalServices: number;

  @Field()
  viewCount: number;

  @Field()
  likeCount: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
