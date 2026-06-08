import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNumber, IsArray, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ServiceType, ServiceVisibility } from '../../enums';

@InputType()
export class CreateServiceInput {
  @Field()
  @IsString()
  @MinLength(3)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ServiceType)
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @Field()
  @IsString()
  destinationCountry: string;

  @Field(() => [String])
  @IsArray()
  sourceCountries: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  price?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  processingTime?: string;

  @Field(() => ServiceVisibility, { nullable: true })
  @IsOptional()
  @IsEnum(ServiceVisibility)
  visibility?: ServiceVisibility;
}

@InputType()
export class UpdateServiceInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  price?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  processingTime?: string;

  @Field(() => ServiceVisibility, { nullable: true })
  @IsOptional()
  @IsEnum(ServiceVisibility)
  visibility?: ServiceVisibility;
}
