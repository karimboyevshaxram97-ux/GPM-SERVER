import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { ServiceType } from '../../enums';
import { MeLiked } from '../like/like.type';
import { LocalizedStringType } from '../common/localized-string.type';

@ObjectType()
export class PhotoType {
  @Field(() => ID)
  _id: string;

  @Field()
  agency: string;

  @Field()
  image: string;

  @Field(() => ServiceType)
  serviceType: ServiceType;

  @Field(() => Int)
  likeCount: number;

  @Field(() => Int)
  viewCount: number;

  @Field(() => Int)
  commentCount: number;

  @Field(() => [MeLiked], { nullable: true })
  meLiked?: MeLiked[];

  // Ko'rsatish uchun qo'shib beriladigan agentlik ma'lumotlari
  @Field(() => LocalizedStringType, { nullable: true })
  agencyName?: LocalizedStringType;

  @Field({ nullable: true })
  agencyLogo?: string;

  @Field({ nullable: true })
  createdAt?: Date;
}

@ObjectType()
class PhotoInquiryMeta {
  @Field(() => Int)
  total: number;
}

@ObjectType()
export class PhotosInquiryResult {
  @Field(() => [PhotoType])
  list: PhotoType[];

  @Field(() => [PhotoInquiryMeta])
  metaCounter: PhotoInquiryMeta[];
}

@ObjectType()
export class PhotoCommentAttachmentType {
  @Field()
  url: string;

  @Field()
  type: string;

  @Field()
  name: string;
}

@ObjectType()
export class PhotoCommentType {
  @Field(() => ID)
  _id: string;

  @Field()
  photo: string;

  @Field()
  user: string;

  // Attachment-only izoh matnsiz bo'lishi mumkin — GraphQL SDL darajasida ham
  // nullable, aks holda birinchi matnisiz izoh serializatsiyada xato beradi.
  @Field({ nullable: true })
  text?: string;

  @Field(() => [PhotoCommentAttachmentType], { nullable: true })
  attachments?: PhotoCommentAttachmentType[];

  @Field({ nullable: true })
  userName?: string;

  @Field({ nullable: true })
  userAvatar?: string;

  @Field({ nullable: true })
  createdAt?: Date;
}
