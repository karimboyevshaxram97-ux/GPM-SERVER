import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsMongoId,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

@InputType()
export class CreateReviewInput {
  @Field()
  @IsMongoId()
  agencyId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsMongoId()
  serviceId?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  comment?: string;
}
