import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ServiceStatus, ServiceType, ServiceVisibility } from '../../enums';

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

  @Field(() => ServiceType)
  serviceType: ServiceType;

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

  @Field(() => ServiceVisibility)
  visibility: ServiceVisibility;

  @Field()
  averageRating: number;

  @Field()
  totalReviews: number;

  @Field()
  currentApplicationCount: number;

  @Field()
  viewCount: number;

  @Field()
  likeCount: number;

  @Field({ nullable: true })
  maxApplicationCount?: number;

  @Field(() => [String])
  tags: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
