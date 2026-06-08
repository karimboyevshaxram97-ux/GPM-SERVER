import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/User.model';
import { Agency, AgencyDocument } from '../../schemas/Agency.model';
import { AgencyVerificationStatus, AgencyStatus, UserStatus } from '../../libs/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>,
  ) {}

  async getPlatformStats() {
    const [totalUsers, totalAgencies, totalServices, pendingAgencyVerifications] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.agencyModel.countDocuments().exec(),
      this.agencyModel.aggregate([{ $group: { _id: null, total: { $sum: '$totalServices' } } }]).exec(),
      this.agencyModel.countDocuments({ verificationStatus: AgencyVerificationStatus.PENDING }).exec(),
    ]);

    return {
      totalUsers,
      totalAgencies,
      totalServices: totalServices[0]?.total ?? 0,
      totalApplications: 0,
      totalReviews: 0,
      activeSubscriptions: 0,
      pendingAgencyVerifications,
    };
  }

  async getPendingVerifications(): Promise<AgencyDocument[]> {
    return this.agencyModel
      .find({ verificationStatus: AgencyVerificationStatus.PENDING })
      .sort({ createdAt: 1 })
      .exec();
  }

  async approveAgency(agencyId: string): Promise<AgencyDocument> {
    const agency = await this.agencyModel.findById(agencyId).exec();
    if (!agency) throw new NotFoundException('Agency not found');

    agency.verificationStatus = AgencyVerificationStatus.VERIFIED;
    agency.verificationDate = new Date();
    return agency.save();
  }

  async rejectAgency(agencyId: string, reason: string): Promise<AgencyDocument> {
    const agency = await this.agencyModel.findById(agencyId).exec();
    if (!agency) throw new NotFoundException('Agency not found');

    agency.verificationStatus = AgencyVerificationStatus.REJECTED;
    return agency.save();
  }

  async suspendAgency(agencyId: string): Promise<AgencyDocument> {
    const agency = await this.agencyModel.findById(agencyId).exec();
    if (!agency) throw new NotFoundException('Agency not found');

    agency.status = AgencyStatus.SUSPENDED;
    return agency.save();
  }

  async activateAgency(agencyId: string): Promise<AgencyDocument> {
    const agency = await this.agencyModel.findById(agencyId).exec();
    if (!agency) throw new NotFoundException('Agency not found');

    agency.status = AgencyStatus.ACTIVE;
    return agency.save();
  }

  async banUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    user.status = UserStatus.BANNED;
    return user.save();
  }

  async unbanUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    user.status = UserStatus.ACTIVE;
    return user.save();
  }

  async getAllUsers(page = 1, limit = 20): Promise<UserDocument[]> {
    return this.userModel
      .find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAllAgencies(page = 1, limit = 20): Promise<AgencyDocument[]> {
    return this.agencyModel
      .find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
  }
}
