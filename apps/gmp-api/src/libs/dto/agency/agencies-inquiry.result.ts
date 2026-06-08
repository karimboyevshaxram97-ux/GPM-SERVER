import { ObjectType, Field, Int } from '@nestjs/graphql';
import { AgencyType } from './agency.type';

@ObjectType()
class AgencyInquiryMeta {
  @Field(() => Int)
  total: number;
}

@ObjectType()
export class AgenciesInquiryResult {
  @Field(() => [AgencyType])
  list: AgencyType[];

  @Field(() => [AgencyInquiryMeta])
  metaCounter: AgencyInquiryMeta[];
}
