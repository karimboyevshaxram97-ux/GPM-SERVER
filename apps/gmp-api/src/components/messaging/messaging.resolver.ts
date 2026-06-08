import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { ConversationType, MessageType } from '../../libs/dto/messaging/messaging.type';
import { CreateConversationInput, SendMessageInput, EditMessageInput } from '../../libs/dto/messaging/messaging.input';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver()
export class MessagingResolver {
  constructor(private readonly messagingService: MessagingService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ConversationType, { name: 'createOrGetConversation' })
  async createOrGetConversation(
    @Args('input') input: CreateConversationInput,
    @CurrentUser() user: any,
  ): Promise<ConversationType> {
    return this.messagingService.getOrCreateConversation(user.userId, input.recipientId, input.agencyId) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [ConversationType], { name: 'myConversations' })
  async myConversations(@CurrentUser() user: any): Promise<ConversationType[]> {
    return this.messagingService.getMyConversations(user.userId) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [MessageType], { name: 'conversationMessages' })
  async conversationMessages(
    @Args('conversationId') conversationId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
    @Args('skip', { type: () => Int, nullable: true }) skip: number,
    @CurrentUser() user: any,
  ): Promise<MessageType[]> {
    return this.messagingService.getConversationMessages(conversationId, user.userId, limit ?? 50, skip ?? 0) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => MessageType, { name: 'sendMessage' })
  async sendMessage(
    @Args('input') input: SendMessageInput,
    @CurrentUser() user: any,
  ): Promise<MessageType> {
    return this.messagingService.sendMessage(input.conversationId, user.userId, input.text, input.attachmentUrls) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => MessageType, { name: 'editMessage' })
  async editMessage(
    @Args('input') input: EditMessageInput,
    @CurrentUser() user: any,
  ): Promise<MessageType> {
    return this.messagingService.editMessage(input.messageId, user.userId, input.text) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Boolean, { name: 'markConversationAsRead' })
  async markConversationAsRead(
    @Args('conversationId') conversationId: string,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    return this.messagingService.markConversationAsRead(conversationId, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ConversationType, { name: 'blockConversation' })
  async blockConversation(
    @Args('conversationId') conversationId: string,
    @CurrentUser() user: any,
  ): Promise<ConversationType> {
    return this.messagingService.blockConversation(conversationId, user.userId) as any;
  }
}
