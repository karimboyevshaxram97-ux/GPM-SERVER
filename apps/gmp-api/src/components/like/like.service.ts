import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from '../../schemas/Like.model';
import { Agency, AgencyDocument } from '../../schemas/Agency.model';
import { Service, ServiceDocument } from '../../schemas/Service.model';
import { LikeResult } from '../../libs/dto/like/like.type';
import { LikeTargetType } from '../../libs/enums';

@Injectable()
export class LikeService {
  constructor(
    @InjectModel(Like.name) private readonly likeModel: Model<LikeDocument>,
    @InjectModel(Agency.name) private readonly agencyModel: Model<AgencyDocument>,
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async toggleLike(userId: string, targetId: string, targetType: LikeTargetType): Promise<LikeResult> {
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

  async getLikeStatus(userId: string, targetId: string, targetType: LikeTargetType): Promise<LikeResult> {
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

  private async updateLikeCount(targetId: string, targetType: LikeTargetType, delta: number): Promise<void> {
    const model: Model<any> = targetType === LikeTargetType.AGENCY ? this.agencyModel : this.serviceModel;
    await model.findByIdAndUpdate(targetId, { $inc: { likeCount: delta } }).exec();
  }
}
