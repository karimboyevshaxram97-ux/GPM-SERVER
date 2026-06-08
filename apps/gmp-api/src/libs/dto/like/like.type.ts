import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class LikeResult {
  @Field()
  isLiked: boolean;

  @Field(() => Int)
  likeCount: number;
}
