import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ReviewStatus } from '../../../common/enums/review.enum';

@ObjectType()
export class ReviewType {
  @Field(() => ID)
  _id: string;

  @Field()
  user: string;

  @Field()
  agency: string;

  @Field({ nullable: true })
  service?: string;

  @Field(() => ReviewStatus)
  status: ReviewStatus;

  @Field()
  rating: number;

  @Field({ nullable: true })
  comment?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
