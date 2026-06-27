import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class LocalizedStringType {
  @Field({ nullable: true })
  uz?: string;

  @Field({ nullable: true })
  ru?: string;

  @Field({ nullable: true })
  en?: string;

  @Field({ nullable: true })
  ko?: string;
}
