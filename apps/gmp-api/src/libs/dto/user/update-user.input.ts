import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { Lang } from '../../enums';

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  avatar?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nationality?: string;

  @Field(() => Lang, { nullable: true })
  @IsOptional()
  @IsEnum(Lang)
  preferredLanguage?: Lang;
}
