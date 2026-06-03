import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ServiceStatus } from '../../../common/enums';

@ObjectType()
export class ServiceGraphType {
  @Field(() => ID)
  _id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String])
  keywords: string[];

  @Field()
  agency: string;

  @Field(() => String)
  serviceType: string;

  @Field()
  destinationCountry: string;

  @Field(() => [String])
  sourceCountries: string[];

  @Field({ nullable: true })
  price?: number;

  @Field({ nullable: true })
  processingTime?: string;

  @Field(() => ServiceStatus)
  status: ServiceStatus;

  @Field()
  visibility: boolean;

  @Field()
  averageRating: number;

  @Field()
  totalReviews: number;

  @Field(() => [String])
  tags: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
