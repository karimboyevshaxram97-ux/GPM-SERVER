import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow, FollowDocument } from '../../schemas/Follow.model';
import { AgencyService } from '../agency/agency.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../libs/enums';

@Injectable()
export class FollowService {
  constructor(
    @InjectModel(Follow.name) private readonly followModel: Model<FollowDocument>,
    private readonly agencyService: AgencyService,
    private readonly notificationService: NotificationService,
  ) {}

  async follow(userId: string, agencyId: string): Promise<FollowDocument> {
    const existing = await this.followModel
      .findOne({ user: new Types.ObjectId(userId), agency: new Types.ObjectId(agencyId) })
      .exec();

    if (existing) throw new ConflictException('Already following this agency');

    const follow = await this.followModel.create({
      user: new Types.ObjectId(userId),
      agency: new Types.ObjectId(agencyId),
      followedAt: new Date(),
    });

    const agency = await this.agencyService.findById(agencyId);
    if (agency?.owner) {
      await this.notificationService.notify({
        recipient: agency.owner.toString(),
        sender: userId,
        type: NotificationType.FOLLOW,
        message: 'Someone started following your agency',
        targetId: agencyId,
        targetType: 'Agency',
      });
    }

    return follow;
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

  async isFollowing(
    userId: string,
    agencyId: string,
  ): Promise<{ isFollowing: boolean; notificationsEnabled: boolean }> {
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
