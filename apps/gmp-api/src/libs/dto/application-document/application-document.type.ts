import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  ApplicationDocumentKind,
  ApplicationDocumentStatus,
} from '../../enums';

@ObjectType()
export class ApplicationDocumentType {
  @Field(() => ID)
  _id: string;

  @Field()
  application: string;

  @Field()
  user: string;

  @Field()
  agency: string;

  @Field(() => ApplicationDocumentKind)
  kind: ApplicationDocumentKind;

  @Field()
  label: string;

  @Field()
  required: boolean;

  @Field(() => ApplicationDocumentStatus)
  status: ApplicationDocumentStatus;

  @Field({ nullable: true })
  originalName?: string;

  @Field({ nullable: true })
  mimeType?: string;

  @Field(() => Int, { nullable: true })
  size?: number;

  @Field({ nullable: true })
  rejectionReason?: string;

  @Field({ nullable: true })
  uploadedAt?: Date;

  @Field({ nullable: true })
  reviewedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
