import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Photo, PhotoSchema } from '../../schemas/Photo.model';
import { PhotoComment, PhotoCommentSchema } from '../../schemas/PhotoComment.model';
import { Agency, AgencySchema } from '../../schemas/Agency.model';
import { Like, LikeSchema } from '../../schemas/Like.model';
import { PhotoService } from './photo.service';
import { PhotoResolver } from './photo.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Photo.name, schema: PhotoSchema },
      { name: PhotoComment.name, schema: PhotoCommentSchema },
      { name: Agency.name, schema: AgencySchema },
      { name: Like.name, schema: LikeSchema },
    ]),
  ],
  providers: [PhotoService, PhotoResolver],
  exports: [PhotoService],
})
export class PhotoModule {}
