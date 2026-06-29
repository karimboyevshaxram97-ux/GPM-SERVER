import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from '../../schemas/Conversation.model';
import { Message, MessageSchema } from '../../schemas/Message.model';
import { Agency, AgencySchema } from '../../schemas/Agency.model';
import { MessagingService } from './messaging.service';
import { MessagingResolver } from './messaging.resolver';
import { MessagingGateway } from '../../socket/messaging.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Agency.name, schema: AgencySchema },
    ]),
    AuthModule,
  ],
  providers: [MessagingService, MessagingResolver, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
