import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Follow, FollowSchema } from '../../schemas/Follow.model';
import { FollowService } from './follow.service';
import { FollowResolver } from './follow.resolver';

@Module({
  imports: [MongooseModule.forFeature([{ name: Follow.name, schema: FollowSchema }])],
  providers: [FollowService, FollowResolver],
  exports: [FollowService],
})
export class FollowModule {}
