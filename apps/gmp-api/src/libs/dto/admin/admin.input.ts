import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';

@InputType()
export class ApproveAgencyInput {
  @Field()
  @IsString()
  agencyId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class RejectAgencyInput {
  @Field()
  @IsString()
  agencyId: string;

  @Field()
  @IsString()
  reason: string;
}

@InputType()
export class BanUserInput {
  @Field()
  @IsString()
  userId: string;

  @Field()
  @IsString()
  reason: string;
}

@InputType()
export class SuspendAgencyInput {
  @Field()
  @IsString()
  agencyId: string;

  @Field()
  @IsString()
  reason: string;
}
