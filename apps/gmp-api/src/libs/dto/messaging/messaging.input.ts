import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsArray, MinLength } from 'class-validator';

@InputType()
export class CreateConversationInput {
  @Field()
  @IsString()
  recipientId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  initialMessage?: string;
}

@InputType()
export class SendMessageInput {
  @Field()
  @IsString()
  conversationId: string;

  @Field()
  @IsString()
  @MinLength(1)
  text: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  attachmentUrls?: string[];
}

@InputType()
export class EditMessageInput {
  @Field()
  @IsString()
  messageId: string;

  @Field()
  @IsString()
  @MinLength(1)
  text: string;
}
