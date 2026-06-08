import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow, FollowDocument } from '../../schemas/Follow.model';

@Injectable()
export class FollowService {
  constructor(@InjectModel(Follow.name) private followModel: Model<FollowDocument>) {}

  async follow(userId: string, agencyId: string): Promise<FollowDocument> {
    const existing = await this.followModel
      .findOne({ user: new Types.ObjectId(userId), agency: new Types.ObjectId(agencyId) })
      .exec();

    if (existing) throw new ConflictException('Already following this agency');

    const follow = new this.followModel({
      user: new Types.ObjectId(userId),
      agency: new Types.ObjectId(agencyId),
      followedAt: new Date(),
    });
    return follow.save();
  }

  async unfollow(userId: string, agencyId: string): Promise<boolean> {
    const result = await this.followModel
      .findOneAndDelete({ user: new Types.ObjectId(userId), agency: new Types.ObjectId(agencyId) })
      .exec();
    if (!result) throw new NotFoundException('Follow record not found');
    return true;
  }

  async toggleNotifications(userId: string, agencyId: string): Promise<FollowDocument> {
    const follow = await this.followModel
      .findOne({ user: new Types.ObjectId(userId), agency: new Types.ObjectId(agencyId) })
      .exec();

    if (!follow) throw new NotFoundException('Follow record not found');
    follow.notificationsEnabled = !follow.notificationsEnabled;
    return follow.save();
  }

  async isFollowing(userId: string, agencyId: string): Promise<{ isFollowing: boolean; notificationsEnabled: boolean }> {
    const follow = await this.followModel
      .findOne({ user: new Types.ObjectId(userId), agency: new Types.ObjectId(agencyId) })
      .exec();
    return {
      isFollowing: !!follow,
      notificationsEnabled: follow?.notificationsEnabled ?? false,
    };
  }

  async getFollowingAgencies(userId: string): Promise<FollowDocument[]> {
    return this.followModel.find({ user: new Types.ObjectId(userId) }).sort({ followedAt: -1 }).exec();
  }

  async getAgencyFollowers(agencyId: string): Promise<FollowDocument[]> {
    return this.followModel.find({ agency: new Types.ObjectId(agencyId) }).sort({ followedAt: -1 }).exec();
  }

  async getFollowerCount(agencyId: string): Promise<number> {
    return this.followModel.countDocuments({ agency: new Types.ObjectId(agencyId) }).exec();
  }
}
