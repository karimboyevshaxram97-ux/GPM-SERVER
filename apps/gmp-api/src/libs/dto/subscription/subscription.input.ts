import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BillingCycle, SupportLevel } from '../../enums';

@InputType()
export class PlanFeatureInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsBoolean()
  included: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

@InputType()
export class CreateSubscriptionPlanInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  annualPrice: number;

  @Field(() => [PlanFeatureInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureInput)
  features?: PlanFeatureInput[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxServices?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxTeamMembers?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxApplicationsPerMonth?: number;

  @Field(() => SupportLevel, { nullable: true })
  @IsOptional()
  @IsEnum(SupportLevel)
  supportLevel?: SupportLevel;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

@InputType()
export class SubscribeToPlanInput {
  @Field()
  @IsString()
  agencyId: string;

  @Field()
  @IsString()
  planId: string;

  @Field(() => BillingCycle)
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}
