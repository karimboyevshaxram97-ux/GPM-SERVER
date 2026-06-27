import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNumber, IsArray, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceStatus, ServiceType, ServiceVisibility } from '../../enums';
import { LocalizedStringInput } from '../common/localized-string.input';

@InputType()
export class CreateServiceInput {
  @Field(() => LocalizedStringInput)
  @ValidateNested()
  @Type(() => LocalizedStringInput)
  name: LocalizedStringInput;

  @Field(() => LocalizedStringInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringInput)
  description?: LocalizedStringInput;

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

  @Field(() => ServiceStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @Field(() => ServiceVisibility, { nullable: true })
  @IsOptional()
  @IsEnum(ServiceVisibility)
  visibility?: ServiceVisibility;
}

@InputType()
export class UpdateServiceInput {
  @Field(() => LocalizedStringInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringInput)
  name?: LocalizedStringInput;

  @Field(() => LocalizedStringInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringInput)
  description?: LocalizedStringInput;

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
