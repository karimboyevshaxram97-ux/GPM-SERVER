import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Follow, FollowSchema } from '../../schemas/Follow.model';
import { FollowService } from './follow.service';
import { FollowResolver } from './follow.resolver';
import { AgencyModule } from '../agency/agency.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Follow.name, schema: FollowSchema }]),
    // ServiceModule (B14 fix) endi FollowModule'ni import qiladi, ServiceModule esa
    // AgencyModule bilan allaqachon forwardRef orqali sirkulyar bog'langan — shu yangi
    // yo'l (Agency -> Service -> Follow -> Agency) uchun ham forwardRef kerak bo'ldi.
    forwardRef(() => AgencyModule),
    NotificationModule,
  ],
  providers: [FollowService, FollowResolver],
  exports: [FollowService],
})
export class FollowModule {}
