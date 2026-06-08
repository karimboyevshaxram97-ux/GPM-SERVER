import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AgencyStatus, AgencyVerificationStatus, AgencyInquirySort, Direction } from '../../enums';

@InputType()
export class AgenciesInquiryInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  text?: string;

  @Field(() => AgencyStatus, { nullable: true })
  @IsOptional()
  @IsEnum(AgencyStatus)
  status?: AgencyStatus;

  @Field(() => AgencyVerificationStatus, { nullable: true })
  @IsOptional()
  @IsEnum(AgencyVerificationStatus)
  verificationStatus?: AgencyVerificationStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Field(() => AgencyInquirySort, { defaultValue: AgencyInquirySort.CREATED_AT })
  @IsEnum(AgencyInquirySort)
  sort: AgencyInquirySort = AgencyInquirySort.CREATED_AT;

  @Field(() => Direction, { defaultValue: Direction.DESC })
  @IsEnum(Direction)
  direction: Direction = Direction.DESC;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number = 1;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
