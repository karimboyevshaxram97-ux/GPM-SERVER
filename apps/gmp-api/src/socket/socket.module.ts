import { Module } from '@nestjs/common';
import { AuthModule } from '../components/auth/auth.module';
import { MessagingGateway } from './messaging.gateway';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [AuthModule],
  providers: [MessagingGateway, NotificationGateway],
  exports: [NotificationGateway],
})
export class SocketModule {}
