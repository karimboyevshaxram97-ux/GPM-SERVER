import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';
import { ApplicationStatus } from '../../enums';

@InputType()
export class CreateApplicationInput {
  @Field()
  @IsString()
  serviceId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  documents?: string[];
}

@InputType()
export class UpdateApplicationInput {
  @Field(() => ApplicationStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  documents?: string[];
}
