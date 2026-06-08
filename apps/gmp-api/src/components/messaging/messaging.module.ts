import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from '../../schemas/Conversation.model';
import { Message, MessageSchema } from '../../schemas/Message.model';
import { MessagingService } from './messaging.service';
import { MessagingResolver } from './messaging.resolver';
import { MessagingGateway } from './messaging.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  providers: [MessagingService, MessagingResolver, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
