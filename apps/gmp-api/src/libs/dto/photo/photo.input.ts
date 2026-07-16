import { InputType, Field, Int } from '@nestjs/graphql';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
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

  @Field({ nullable: true })
  @IsOptional()
  @IsMongoId()
  parentCommentId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  text?: string;

  // Oldindan /upload/image yoki /upload/video orqali yuklangan fayllarning URL'lari
  // (photo.service.ts'da: kamida text yoki attachmentUrls'dan biri bo'lishi, 4 tagacha
  // rasm YOKI 1 ta video — aralash emas, deb tekshiriladi).
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  attachmentUrls?: string[];
}
