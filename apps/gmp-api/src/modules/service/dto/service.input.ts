import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNumber, IsArray, IsOptional, MinLength } from 'class-validator';
import { ServiceType as ServiceTypeEnum } from '../../../common/enums';

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

  @Field(() => String)
  serviceType: string;

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
}
