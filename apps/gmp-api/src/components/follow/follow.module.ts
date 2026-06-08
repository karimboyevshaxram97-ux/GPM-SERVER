import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Follow, FollowSchema } from '../../schemas/Follow.model';
import { FollowService } from './follow.service';
import { FollowResolver } from './follow.resolver';
import { AgencyModule } from '../agency/agency.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Follow.name, schema: FollowSchema }]),
    AgencyModule,
    NotificationModule,
  ],
  providers: [FollowService, FollowResolver],
  exports: [FollowService],
})
export class FollowModule {}
