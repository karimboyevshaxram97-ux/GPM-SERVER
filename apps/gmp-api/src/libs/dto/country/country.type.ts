import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class CountryType {
  @Field(() => ID)
  _id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field({ nullable: true })
  code3?: string;

  @Field(() => Int, { nullable: true })
  isoNumeric?: number;

  @Field({ nullable: true })
  region?: string;

  @Field({ nullable: true })
  subregion?: string;

  @Field({ nullable: true })
  flag?: string;

  @Field({ nullable: true })
  flagUrl?: string;

  @Field()
  isActive: boolean;
}
