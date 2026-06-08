import { InputType, Field, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

@InputType()
export class NotificationsInquiryInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number = 1;

  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
