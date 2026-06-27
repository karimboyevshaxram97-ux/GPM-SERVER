import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { AgencyType } from '../agency/agency.type';
import { UserType } from '../user/user.type';

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

@ObjectType()
export class AdminUsersResult {
  @Field(() => [UserType])
  list: UserType[];

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class AdminAgenciesResult {
  @Field(() => [AgencyType])
  list: AgencyType[];

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class MonthlyStatPoint {
  @Field()
  month: string;

  @Field(() => Int)
  users: number;

  @Field(() => Int)
  agencies: number;

  @Field(() => Int)
  applications: number;
}

@ObjectType()
export class AuditLogType {
  @Field(() => ID)
  _id: string;

  @Field()
  adminId: string;

  @Field()
  action: string;

  @Field()
  targetType: string;

  @Field()
  targetId: string;

  @Field({ nullable: true })
  targetName?: string;

  @Field({ nullable: true })
  reason?: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class AuditLogsResult {
  @Field(() => [AuditLogType])
  list: AuditLogType[];

  @Field(() => Int)
  total: number;
}
