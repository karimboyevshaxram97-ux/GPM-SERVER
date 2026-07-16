import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ApplicationDocumentKind,
  ApplicationDocumentStatus,
} from '../../enums';

@InputType()
export class RequestApplicationDocumentInput {
  @Field()
  @IsString()
  applicationId: string;

  @Field(() => ApplicationDocumentKind)
  @IsEnum(ApplicationDocumentKind)
  kind: ApplicationDocumentKind;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  label: string;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

@InputType()
export class ReviewApplicationDocumentInput {
  @Field()
  @IsString()
  documentId: string;

  @Field(() => ApplicationDocumentStatus)
  @IsEnum(ApplicationDocumentStatus)
  status: ApplicationDocumentStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
