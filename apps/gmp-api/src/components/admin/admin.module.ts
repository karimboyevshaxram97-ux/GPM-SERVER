import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schemas/User.model';
import { Agency, AgencySchema } from '../../schemas/Agency.model';
import {
  Application,
  ApplicationSchema,
} from '../../schemas/Application.model';
import { Review, ReviewSchema } from '../../schemas/Review.model';
import { Service, ServiceSchema } from '../../schemas/Service.model';
import { AuditLog, AuditLogSchema } from '../../schemas/AuditLog.model';
import { Follow, FollowSchema } from '../../schemas/Follow.model';
import { Like, LikeSchema } from '../../schemas/Like.model';
import { View, ViewSchema } from '../../schemas/View.model';
import {
  ApplicationDocument,
  ApplicationDocumentSchema,
} from '../../schemas/ApplicationDocument.model';
import {
  Conversation,
  ConversationSchema,
} from '../../schemas/Conversation.model';
import { Message, MessageSchema } from '../../schemas/Message.model';
import {
  Notification,
  NotificationSchema,
} from '../../schemas/Notification.model';
import {
  PhotoComment,
  PhotoCommentSchema,
} from '../../schemas/PhotoComment.model';
import {
  SupportTicket,
  SupportTicketSchema,
} from '../../schemas/SupportTicket.model';
import {
  AgencySubscription,
  AgencySubscriptionSchema,
} from '../../schemas/AgencySubscription.model';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';
import { AgencyModule } from '../agency/agency.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Agency.name, schema: AgencySchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Like.name, schema: LikeSchema },
      { name: View.name, schema: ViewSchema },
      { name: ApplicationDocument.name, schema: ApplicationDocumentSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: PhotoComment.name, schema: PhotoCommentSchema },
      { name: SupportTicket.name, schema: SupportTicketSchema },
      { name: AgencySubscription.name, schema: AgencySubscriptionSchema },
    ]),
    AgencyModule,
    NotificationModule,
  ],
  providers: [AdminService, AdminResolver],
})
export class AdminModule {}
