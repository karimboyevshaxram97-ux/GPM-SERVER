import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class AgencyStatType {
  @Field(() => ID)
  _id: string;

  @Field()
  agency: string;

  @Field()
  date: Date;

  @Field(() => Int)
  profileViews: number;

  @Field(() => Int)
  applicationCount: number;

  @Field(() => Float)
  averageRating: number;

  @Field(() => Int)
  reviewCount: number;

  @Field(() => Int)
  followerCount: number;

  @Field(() => Int)
  activeServices: number;
}

@ObjectType()
export class ServiceStatType {
  @Field(() => ID)
  _id: string;

  @Field()
  service: string;

  @Field()
  date: Date;

  @Field(() => Int)
  views: number;

  @Field(() => Int)
  applicationCount: number;

  @Field(() => Float)
  rating: number;

  @Field(() => Int)
  reviewCount: number;
}

@ObjectType()
export class PlatformStatsType {
  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  totalAgencies: number;

  @Field(() => Int)
  totalServices: number;

  @Field(() => Int)
  totalApplications: number;

  @Field(() => Int)
  totalReviews: number;

  @Field(() => Int)
  activeSubscriptions: number;
}
