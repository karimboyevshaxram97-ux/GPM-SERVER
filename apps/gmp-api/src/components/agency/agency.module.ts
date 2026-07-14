import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Agency, AgencySchema } from '../../schemas/Agency.model';
import { Service, ServiceSchema } from '../../schemas/Service.model';
import { Review, ReviewSchema } from '../../schemas/Review.model';
import { Follow, FollowSchema } from '../../schemas/Follow.model';
import { Like, LikeSchema } from '../../schemas/Like.model';
import { View, ViewSchema } from '../../schemas/View.model';
import { Photo, PhotoSchema } from '../../schemas/Photo.model';
import {
  PhotoComment,
  PhotoCommentSchema,
} from '../../schemas/PhotoComment.model';
import {
  AgencySubscription,
  AgencySubscriptionSchema,
} from '../../schemas/AgencySubscription.model';
import { AgencyService } from './agency.service';
import { AgencyResolver } from './agency.resolver';
import { UserModule } from '../user/user.module';
import { ViewModule } from '../view/view.module';
import { ServiceModule } from '../service/service.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Agency.name, schema: AgencySchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Like.name, schema: LikeSchema },
      { name: View.name, schema: ViewSchema },
      { name: Photo.name, schema: PhotoSchema },
      { name: PhotoComment.name, schema: PhotoCommentSchema },
      { name: AgencySubscription.name, schema: AgencySubscriptionSchema },
    ]),
    UserModule,
    ViewModule,
    forwardRef(() => ServiceModule),
  ],
  providers: [AgencyService, AgencyResolver],
  exports: [AgencyService],
})
export class AgencyModule {}
