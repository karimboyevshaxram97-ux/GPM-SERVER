import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class LikeResult {
  @Field()
  isLiked: boolean;

  @Field(() => Int)
  likeCount: number;
}

@ObjectType()
export class MeLiked {
  @Field({ nullable: true })
  user?: string;

  @Field({ nullable: true })
  targetId?: string;

  @Field({ nullable: true })
  myFavorite?: boolean;
}
