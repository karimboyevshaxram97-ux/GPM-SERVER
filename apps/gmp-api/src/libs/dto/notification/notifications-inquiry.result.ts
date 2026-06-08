import { ObjectType, Field, Int } from '@nestjs/graphql';
import { NotificationGqlType } from './notification.type';

@ObjectType()
class NotificationInquiryMeta {
  @Field(() => Int)
  total: number;
}

@ObjectType()
export class NotificationsInquiryResult {
  @Field(() => [NotificationGqlType])
  list: NotificationGqlType[];

  @Field(() => [NotificationInquiryMeta])
  metaCounter: NotificationInquiryMeta[];
}
