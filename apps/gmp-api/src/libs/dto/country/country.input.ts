import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Length,
} from 'class-validator';

@InputType()
export class CreateCountryInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  @Length(2, 2)
  code: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  code3?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  isoNumeric?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  region?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subregion?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  flag?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  flagUrl?: string;
}

@InputType()
export class CountryFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  region?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}
