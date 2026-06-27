import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SupportTicketType {
  @Field(() => ID)
  _id: string;

  @Field({ nullable: true })
  user?: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  role?: string;

  @Field()
  message: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
class SupportTicketsMeta {
  @Field(() => Int)
  total: number;
}

@ObjectType()
export class SupportTicketsResult {
  @Field(() => [SupportTicketType])
  list: SupportTicketType[];

  @Field(() => [SupportTicketsMeta])
  metaCounter: SupportTicketsMeta[];
}
