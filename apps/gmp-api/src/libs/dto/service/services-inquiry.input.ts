import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ServiceStatus, ServiceType, ServiceInquirySort, Direction, ServiceVisibility } from '../../enums';

@InputType()
export class ServicesInquiryInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  text?: string;

  @Field(() => ServiceType, { nullable: true })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  destinationCountry?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sourceCountry?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @Field(() => ServiceStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @Field(() => ServiceVisibility, { nullable: true })
  @IsOptional()
  @IsEnum(ServiceVisibility)
  visibility?: ServiceVisibility;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @Field(() => ServiceInquirySort, { defaultValue: ServiceInquirySort.CREATED_AT })
  @IsEnum(ServiceInquirySort)
  sort: ServiceInquirySort = ServiceInquirySort.CREATED_AT;

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
