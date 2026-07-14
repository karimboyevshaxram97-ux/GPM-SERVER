import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Conversation,
  ConversationSchema,
} from '../../schemas/Conversation.model';
import { Message, MessageSchema } from '../../schemas/Message.model';
import { Agency, AgencySchema } from '../../schemas/Agency.model';
import { MessagingService } from './messaging.service';
import { MessagingResolver } from './messaging.resolver';
import { MessagingGateway } from '../../socket/messaging.gateway';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Agency.name, schema: AgencySchema },
    ]),
    AuthModule,
    // NotificationGateway'ni import qilamiz — messaging.service.ts shu bitta
    // per-user socket registry orqali 'message:new'/'message:edited' yuboradi.
    // MessagingGateway (anonim broadcast + Gemini bot chat) esa butunlay boshqa,
    // ataylab alohida funksiya — unga tegilmaydi.
    NotificationModule,
  ],
  providers: [MessagingService, MessagingResolver, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
