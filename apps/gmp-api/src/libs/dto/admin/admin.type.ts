import { ObjectType, Field, Int } from '@nestjs/graphql';

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

  @Field(() => Int)
  pendingAgencyVerifications: number;
}
