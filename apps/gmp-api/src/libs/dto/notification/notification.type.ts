import { ObjectType, Field, ID } from '@nestjs/graphql';
import { NotificationType } from '../../enums';

@ObjectType()
export class NotificationGqlType {
  @Field(() => ID)
  _id: string;

  @Field()
  recipient: string;

  @Field({ nullable: true })
  sender?: string;

  @Field(() => NotificationType)
  type: NotificationType;

  @Field()
  message: string;

  @Field({ nullable: true })
  targetId?: string;

  @Field({ nullable: true })
  targetType?: string;

  @Field()
  isRead: boolean;

  @Field()
  createdAt: Date;
}
