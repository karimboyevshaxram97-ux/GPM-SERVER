import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApplicationStatus, PaymentStatus } from '../../../common/enums';

@ObjectType()
export class ApplicationType {
  @Field(() => ID)
  _id: string;

  @Field()
  user: string;

  @Field()
  service: string;

  @Field()
  agency: string;

  @Field(() => ApplicationStatus)
  status: ApplicationStatus;

  @Field(() => PaymentStatus)
  paymentStatus: PaymentStatus;

  @Field({ nullable: true })
  paymentAmount?: number;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  appliedAt: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  rejectionReason?: string;

  @Field()
  isReviewEligible: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
