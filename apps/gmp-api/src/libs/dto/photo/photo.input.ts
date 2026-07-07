import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsMongoId, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ServiceType } from '../../enums';

@InputType()
export class CreatePhotoInput {
  @Field()
  @IsString()
  @MinLength(1)
  image: string;

  @Field(() => ServiceType)
  @IsEnum(ServiceType)
  serviceType: ServiceType;
}

@InputType()
export class PhotosInquiryInput {
  @Field(() => ServiceType, { nullable: true })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @Field({ nullable: true })
  @IsOptional()
  @IsMongoId()
  agencyId?: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number = 1;

  @Field(() => Int, { defaultValue: 3 })
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 3;
}

@InputType()
export class CreatePhotoCommentInput {
  @Field()
  @IsMongoId()
  photoId: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text: string;
}
