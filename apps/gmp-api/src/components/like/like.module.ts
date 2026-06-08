import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Like, LikeSchema } from '../../schemas/Like.model';
import { Agency, AgencySchema } from '../../schemas/Agency.model';
import { Service, ServiceSchema } from '../../schemas/Service.model';
import { LikeService } from './like.service';
import { LikeResolver } from './like.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Like.name, schema: LikeSchema },
      { name: Agency.name, schema: AgencySchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  providers: [LikeService, LikeResolver],
  exports: [LikeService],
})
export class LikeModule {}
