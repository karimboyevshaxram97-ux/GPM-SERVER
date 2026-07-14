import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsEmail,
  IsArray,
  IsOptional,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocalizedStringInput } from '../common/localized-string.input';

@InputType()
export class CreateAgencyInput {
  @Field(() => LocalizedStringInput)
  @ValidateNested()
  @Type(() => LocalizedStringInput)
  name: LocalizedStringInput;

  @Field()
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  logo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @Field(() => LocalizedStringInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringInput)
  description?: LocalizedStringInput;

  @Field(() => [String])
  @IsArray()
  operatingCountries: string[];

  @Field({ nullable: true })
  @IsOptional()
  phoneNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  country?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

@InputType()
export class UpdateAgencyInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  logo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  coverImage?: string;

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

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  operatingCountries?: string[];

  @Field({ nullable: true })
  @IsOptional()
  phoneNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  country?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
