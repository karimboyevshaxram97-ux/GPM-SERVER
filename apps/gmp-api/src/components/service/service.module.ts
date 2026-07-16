import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from '../../schemas/Service.model';
import {
  Application,
  ApplicationSchema,
} from '../../schemas/Application.model';
import { Review, ReviewSchema } from '../../schemas/Review.model';
import { Like, LikeSchema } from '../../schemas/Like.model';
import { View, ViewSchema } from '../../schemas/View.model';
import {
  ApplicationDocument,
  ApplicationDocumentSchema,
} from '../../schemas/ApplicationDocument.model';
import { ServiceService } from './service.service';
import { ServiceResolver } from './service.resolver';
import { AgencyModule } from '../agency/agency.module';
import { UserModule } from '../user/user.module';
import { ViewModule } from '../view/view.module';
import { FollowModule } from '../follow/follow.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Like.name, schema: LikeSchema },
      { name: View.name, schema: ViewSchema },
      { name: ApplicationDocument.name, schema: ApplicationDocumentSchema },
    ]),
    UserModule,
    forwardRef(() => AgencyModule),
    ViewModule,
    FollowModule,
    NotificationModule,
  ],
  providers: [ServiceService, ServiceResolver],
  exports: [ServiceService],
})
export class ServiceModule {}
