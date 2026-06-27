import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { AgencyStatus, AgencyVerificationStatus, SubscriptionStatus } from '../../enums';
import { MeLiked } from '../like/like.type';
import { MeFollowed } from '../follow/follow.type';
import { LocalizedStringType } from '../common/localized-string.type';

@ObjectType()
export class AgencyType {
  @Field(() => ID)
  _id: string;

  @Field(() => LocalizedStringType)
  name: LocalizedStringType;

  @Field()
  slug: string;

  @Field(() => LocalizedStringType, { nullable: true })
  description?: LocalizedStringType;

  @Field({ nullable: true })
  logo?: string;

  @Field({ nullable: true })
  website?: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  country?: string;

  @Field(() => Float, { nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  longitude?: number;

  @Field({ nullable: true })
  coverImage?: string;

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

  @Field(() => SubscriptionStatus, { nullable: true })
  subscriptionStatus?: SubscriptionStatus;

  @Field({ nullable: true })
  totalReviews?: number;

  @Field({ nullable: true })
  averageRating?: number;

  @Field({ nullable: true })
  totalServices?: number;

  @Field({ nullable: true })
  viewCount?: number;

  @Field({ nullable: true })
  likeCount?: number;

  @Field(() => [MeLiked], { nullable: true })
  meLiked?: MeLiked[];

  @Field(() => [MeFollowed], { nullable: true })
  meFollowed?: MeFollowed[];

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
