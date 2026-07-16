import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from '../../schemas/Like.model';
import { Agency, AgencyDocument } from '../../schemas/Agency.model';
import { Service, ServiceDocument } from '../../schemas/Service.model';
import { Photo, PhotoDocument } from '../../schemas/Photo.model';
import {
  PhotoComment,
  PhotoCommentDocument,
} from '../../schemas/PhotoComment.model';
import { LikeResult } from '../../libs/dto/like/like.type';
import { LikeTargetType } from '../../libs/enums';

@Injectable()
export class LikeService {
  constructor(
    @InjectModel(Like.name) private readonly likeModel: Model<LikeDocument>,
    @InjectModel(Agency.name)
    private readonly agencyModel: Model<AgencyDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Photo.name) private readonly photoModel: Model<PhotoDocument>,
    @InjectModel(PhotoComment.name)
    private readonly photoCommentModel: Model<PhotoCommentDocument>,
  ) {}

  async toggleLike(
    userId: string,
    targetId: string,
    targetType: LikeTargetType,
  ): Promise<LikeResult> {
    await this.assertTargetExists(targetId, targetType);

    const existing = await this.likeModel
      .findOne({
        user: new Types.ObjectId(userId),
        targetId: new Types.ObjectId(targetId),
        targetType,
      })
      .exec();

    if (existing) {
      await existing.deleteOne();
      await this.updateLikeCount(targetId, targetType, -1);
    } else {
      await this.likeModel.create({
        user: new Types.ObjectId(userId),
        targetId: new Types.ObjectId(targetId),
        targetType,
      });
      await this.updateLikeCount(targetId, targetType, 1);
    }

    const likeCount = await this.likeModel
      .countDocuments({ targetId: new Types.ObjectId(targetId), targetType })
      .exec();

    return { isLiked: !existing, likeCount };
  }

  async getLikeStatus(
    userId: string,
    targetId: string,
    targetType: LikeTargetType,
  ): Promise<LikeResult> {
    await this.assertTargetExists(targetId, targetType);

    const existing = await this.likeModel
      .findOne({
        user: new Types.ObjectId(userId),
        targetId: new Types.ObjectId(targetId),
        targetType,
      })
      .exec();

    const likeCount = await this.likeModel
      .countDocuments({ targetId: new Types.ObjectId(targetId), targetType })
      .exec();

    return { isLiked: !!existing, likeCount };
  }

  private targetModel(targetType: LikeTargetType): Model<any> {
    if (targetType === LikeTargetType.AGENCY) return this.agencyModel;
    if (targetType === LikeTargetType.PHOTO) return this.photoModel;
    if (targetType === LikeTargetType.PHOTO_COMMENT)
      return this.photoCommentModel;
    return this.serviceModel;
  }

  private async updateLikeCount(
    targetId: string,
    targetType: LikeTargetType,
    delta: number,
  ): Promise<void> {
    await this.targetModel(targetType)
      .findByIdAndUpdate(targetId, { $inc: { likeCount: delta } })
      .exec();
  }

  private async assertTargetExists(
    targetId: string,
    targetType: LikeTargetType,
  ): Promise<void> {
    const exists = await this.targetModel(targetType).exists({
      _id: new Types.ObjectId(targetId),
    });
    if (!exists) throw new NotFoundException('Like target not found');
  }
}
