import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsEmail, IsArray, MinLength, IsOptional } from 'class-validator';

@InputType()
export class CreateAgencyInput {
  @Field()
  @IsString()
  @MinLength(3)
  name: string;

  @Field()
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => [String])
  @IsArray()
  operatingCountries: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  website?: string;
}

@InputType()
export class UpdateAgencyInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  operatingCountries?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  website?: string;
}
