import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ServiceGraphType } from './service.type';

@ObjectType()
class ServiceInquiryMeta {
  @Field(() => Int)
  total: number;
}

@ObjectType()
export class ServicesInquiryResult {
  @Field(() => [ServiceGraphType])
  list: ServiceGraphType[];

  @Field(() => [ServiceInquiryMeta])
  metaCounter: ServiceInquiryMeta[];
}
