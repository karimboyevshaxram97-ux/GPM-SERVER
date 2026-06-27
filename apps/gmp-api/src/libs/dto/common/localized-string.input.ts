import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, MinLength } from 'class-validator';

@InputType()
export class LocalizedStringInput {
  @Field()
  @IsString()
  @MinLength(1)
  uz: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  ru?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  en?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  ko?: string;
}
