import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { MessagingService } from './messaging.service';
import { ConversationType, MessageType } from '../../libs/dto/messaging/messaging.type';
import { CreateConversationInput, SendMessageInput, EditMessageInput } from '../../libs/dto/messaging/messaging.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver()
export class MessagingResolver {
  constructor(private readonly messagingService: MessagingService) {}

  @Mutation(() => ConversationType, { name: 'createOrGetConversation' })
  async createOrGetConversation(
    @Args('input') input: CreateConversationInput,
    @CurrentUser() user: any,
  ): Promise<ConversationType> {
    console.log('Mutation: createOrGetConversation');
    return this.messagingService.getOrCreateConversation(user._id.toString(), input.recipientId, input.agencyId) as any;
  }

  @Query(() => [ConversationType], { name: 'myConversations' })
  async myConversations(@CurrentUser() user: any): Promise<ConversationType[]> {
    console.log('Query: myConversations');
    return this.messagingService.getMyConversations(user._id.toString()) as any;
  }

  @Query(() => [MessageType], { name: 'conversationMessages' })
  async conversationMessages(
    @Args('conversationId') conversationId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
    @Args('skip', { type: () => Int, nullable: true }) skip: number,
    @CurrentUser() user: any,
  ): Promise<MessageType[]> {
    console.log('Query: conversationMessages');
    return this.messagingService.getConversationMessages(conversationId, user._id.toString(), limit ?? 50, skip ?? 0) as any;
  }

  @Mutation(() => MessageType, { name: 'sendMessage' })
  async sendMessage(
    @Args('input') input: SendMessageInput,
    @CurrentUser() user: any,
  ): Promise<MessageType> {
    console.log('Mutation: sendMessage');
    return this.messagingService.sendMessage(input.conversationId, user._id.toString(), input.text, input.attachmentUrls) as any;
  }

  @Mutation(() => MessageType, { name: 'editMessage' })
  async editMessage(
    @Args('input') input: EditMessageInput,
    @CurrentUser() user: any,
  ): Promise<MessageType> {
    console.log('Mutation: editMessage');
    return this.messagingService.editMessage(input.messageId, user._id.toString(), input.text) as any;
  }

  @Mutation(() => Boolean, { name: 'markConversationAsRead' })
  async markConversationAsRead(
    @Args('conversationId') conversationId: string,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    console.log('Mutation: markConversationAsRead');
    return this.messagingService.markConversationAsRead(conversationId, user._id.toString());
  }

  @Mutation(() => ConversationType, { name: 'blockConversation' })
  async blockConversation(
    @Args('conversationId') conversationId: string,
    @CurrentUser() user: any,
  ): Promise<ConversationType> {
    console.log('Mutation: blockConversation');
    return this.messagingService.blockConversation(conversationId, user._id.toString()) as any;
  }
}
