import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { ConversationStatus } from '../../enums';

@ObjectType()
export class AttachmentType {
  @Field()
  url: string;

  @Field()
  type: string;

  @Field()
  name: string;
}

@ObjectType()
export class MessageType {
  @Field(() => ID)
  _id: string;

  @Field()
  conversation: string;

  @Field()
  sender: string;

  @Field()
  text: string;

  @Field(() => [AttachmentType])
  attachments: AttachmentType[];

  @Field()
  isRead: boolean;

  @Field()
  isEdited: boolean;

  @Field({ nullable: true })
  editedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class ConversationType {
  @Field(() => ID)
  _id: string;

  @Field(() => [String])
  participants: string[];

  @Field({ nullable: true })
  agency?: string;

  @Field({ nullable: true })
  lastMessage?: string;

  @Field({ nullable: true })
  lastMessageAt?: Date;

  @Field(() => Int)
  unreadCount: number;

  @Field(() => ConversationStatus)
  status: ConversationStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
