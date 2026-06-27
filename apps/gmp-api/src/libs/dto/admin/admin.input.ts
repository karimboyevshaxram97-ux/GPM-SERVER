import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';

@InputType()
export class ApproveAgencyInput {
  @Field()
  @IsString()
  agencyId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class RejectAgencyInput {
  @Field()
  @IsString()
  agencyId: string;

  @Field()
  @IsString()
  reason: string;
}

@InputType()
export class BanUserInput {
  @Field()
  @IsString()
  userId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}

@InputType()
export class SuspendAgencyInput {
  @Field()
  @IsString()
  agencyId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}

@InputType()
export class AdminUsersFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  text?: string;

  @Field({ nullable: true })
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsOptional()
  role?: string;
}

@InputType()
export class AdminAgenciesFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  text?: string;

  @Field({ nullable: true })
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsOptional()
  verificationStatus?: string;
}
