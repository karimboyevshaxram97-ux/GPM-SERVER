import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class MeFollowed {
  @Field({ nullable: true })
  user?: string;

  @Field({ nullable: true })
  agency?: string;

  @Field({ nullable: true })
  myFollowing?: boolean;
}

@ObjectType()
export class FollowType {
  @Field(() => ID)
  _id: string;

  @Field()
  user: string;

  @Field()
  agency: string;

  @Field()
  notificationsEnabled: boolean;

  @Field()
  followedAt: Date;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class FollowStatusType {
  @Field()
  isFollowing: boolean;

  @Field()
  notificationsEnabled: boolean;
}
