import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../schemas/User.model';
import { Agency, AgencyDocument } from '../../schemas/Agency.model';
import {
  Application,
  ApplicationDocument,
} from '../../schemas/Application.model';
import { Review, ReviewDocument } from '../../schemas/Review.model';
import { Service, ServiceDocument } from '../../schemas/Service.model';
import { AuditLog, AuditLogDocument } from '../../schemas/AuditLog.model';
import { Follow, FollowDocument } from '../../schemas/Follow.model';
import { Like, LikeDocument } from '../../schemas/Like.model';
import { View, ViewDocument } from '../../schemas/View.model';
import {
  AgencySubscription,
  AgencySubscriptionDocument,
} from '../../schemas/AgencySubscription.model';
import {
  AgencyVerificationStatus,
  AgencyStatus,
  ReviewStatus,
  UserStatus,
  SubscriptionStatus,
  NotificationType,
} from '../../libs/enums';
import {
  AdminUsersFilterInput,
  AdminAgenciesFilterInput,
} from '../../libs/dto/admin/admin.input';
import {
  AdminUsersResult,
  AdminAgenciesResult,
  AuditLogsResult,
  MonthlyStatPoint,
} from '../../libs/dto/admin/admin.type';
import { Message } from '../../libs';
import { AgencyService } from '../agency/agency.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>,
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectModel(View.name) private viewModel: Model<ViewDocument>,
    @InjectModel(AgencySubscription.name)
    private agencySubscriptionModel: Model<AgencySubscriptionDocument>,
    private readonly agencyService: AgencyService,
    private readonly notificationService: NotificationService,
  ) {}

  private normalizeAgency(agency: any): any {
    const item = agency?.toObject ? agency.toObject() : { ...agency };
    const rawName = item.name;
    const fallback =
      item.businessName ||
      item.companyName ||
      item.legalName ||
      item.email ||
      item.slug ||
      `Agency ${item._id?.toString?.() ?? ''}`.trim();

    const name =
      typeof rawName === 'string'
        ? { uz: rawName, ru: rawName, en: rawName, ko: rawName }
        : {
            uz: rawName?.uz || fallback,
            ru: rawName?.ru || rawName?.en || rawName?.uz || fallback,
            en: rawName?.en || rawName?.uz || rawName?.ru || fallback,
            ko: rawName?.ko || rawName?.en || rawName?.uz || fallback,
          };

    return {
      ...item,
      name,
      email: item.email || '',
      operatingCountries: item.operatingCountries ?? [],
      status: item.status ?? AgencyStatus.ACTIVE,
      verificationStatus:
        item.verificationStatus ?? AgencyVerificationStatus.PENDING,
    };
  }

  private async log(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    targetName?: string,
    reason?: string,
  ) {
    await this.auditLogModel.create({
      adminId: new Types.ObjectId(adminId),
      action,
      targetType,
      targetId: new Types.ObjectId(targetId),
      targetName,
      reason,
    });
  }

  async getPlatformStats() {
    const [
      totalUsers,
      totalAgencies,
      totalApplications,
      totalReviews,
      pendingAgencyVerifications,
      servicesAgg,
      activeSubscriptions,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.agencyModel.countDocuments().exec(),
      this.applicationModel.countDocuments().exec(),
      this.reviewModel.countDocuments().exec(),
      this.agencyModel
        .countDocuments({
          verificationStatus: AgencyVerificationStatus.PENDING,
        })
        .exec(),
      this.agencyModel
        .aggregate([
          { $group: { _id: null, total: { $sum: '$totalServices' } } },
        ])
        .exec(),
      this.agencySubscriptionModel
        .countDocuments({ status: SubscriptionStatus.ACTIVE })
        .exec(),
    ]);

    return {
      totalUsers,
      totalAgencies,
      totalServices: servicesAgg[0]?.total ?? 0,
      totalApplications,
      totalReviews,
      activeSubscriptions,
      pendingAgencyVerifications,
    };
  }

  async getMonthlyStats(months = 6): Promise<MonthlyStatPoint[]> {
    const now = new Date();
    const result: MonthlyStatPoint[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = start.toLocaleString('en', {
        month: 'short',
        year: '2-digit',
      });

      const [users, agencies, applications] = await Promise.all([
        this.userModel
          .countDocuments({ createdAt: { $gte: start, $lt: end } })
          .exec(),
        this.agencyModel
          .countDocuments({ createdAt: { $gte: start, $lt: end } })
          .exec(),
        this.applicationModel
          .countDocuments({ createdAt: { $gte: start, $lt: end } })
          .exec(),
      ]);

      result.push({ month: label, users, agencies, applications });
    }

    return result;
  }

  async getPendingVerifications(): Promise<AgencyDocument[]> {
    const list = await this.agencyModel
      .find({ verificationStatus: AgencyVerificationStatus.PENDING })
      .sort({ createdAt: 1 })
      .exec();

    return list.map((agency) => this.normalizeAgency(agency)) as any;
  }

  async getAllUsers(
    page = 1,
    limit = 20,
    filter?: AdminUsersFilterInput,
  ): Promise<AdminUsersResult> {
    const match: any = {};

    if (filter?.text) {
      const regex = { $regex: filter.text, $options: 'i' };
      match.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phoneNumber: regex },
      ];
    }
    if (filter?.status) match.status = filter.status;
    if (filter?.role) match.role = filter.role;

    const [list, total] = await Promise.all([
      this.userModel
        .find(match)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(match).exec(),
    ]);

    return { list: list as any, total };
  }

  async getAllAgencies(
    page = 1,
    limit = 20,
    filter?: AdminAgenciesFilterInput,
  ): Promise<AdminAgenciesResult> {
    const match: any = {};

    if (filter?.text) {
      const regex = { $regex: filter.text, $options: 'i' };
      match.$or = [
        { 'name.en': regex },
        { 'name.uz': regex },
        { 'name.ru': regex },
        { email: regex },
      ];
    }
    if (filter?.status) match.status = filter.status;
    if (filter?.verificationStatus)
      match.verificationStatus = filter.verificationStatus;

    const [list, total] = await Promise.all([
      this.agencyModel
        .find(match)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.agencyModel.countDocuments(match).exec(),
    ]);

    return {
      list: list.map((agency) => this.normalizeAgency(agency)) as any,
      total,
    };
  }

  async getAuditLogs(page = 1, limit = 20): Promise<AuditLogsResult> {
    const [list, total] = await Promise.all([
      this.auditLogModel
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments().exec(),
    ]);
    return { list: list as any, total };
  }

  async getReviews(status?: ReviewStatus): Promise<ReviewDocument[]> {
    const match = status ? { status } : {};
    return this.reviewModel.find(match).sort({ createdAt: -1 }).exec();
  }

  async approveAgency(
    adminId: string,
    agencyId: string,
  ): Promise<AgencyDocument> {
    const agency = await this.agencyModel.findById(agencyId).exec();
    if (!agency)
      throw new InternalServerErrorException(Message.AGENCY_NOT_FOUND);
    agency.verificationStatus = AgencyVerificationStatus.VERIFIED;
    agency.verificationDate = new Date();
    const saved = await agency.save();
    await this.log(
      adminId,
      'APPROVE_AGENCY',
      'AGENCY',
      agencyId,
      this.agencyName(agency),
    );
    return this.normalizeAgency(saved);
  }

  async rejectAgency(
    adminId: string,
    agencyId: string,
    reason: string,
  ): Promise<AgencyDocument> {
    const agency = await this.agencyModel.findById(agencyId).exec();
    if (!agency)
      throw new InternalServerErrorException(Message.AGENCY_NOT_FOUND);
    agency.verificationStatus = AgencyVerificationStatus.REJECTED;
    const saved = await agency.save();
    await this.log(
      adminId,
      'REJECT_AGENCY',
      'AGENCY',
      agencyId,
      this.agencyName(agency),
      reason,
    );
    return this.normalizeAgency(saved);
  }

  async suspendAgency(
    adminId: string,
    agencyId: string,
  ): Promise<AgencyDocument> {
    const agency = await this.agencyModel.findById(agencyId).exec();
    if (!agency)
      throw new InternalServerErrorException(Message.AGENCY_NOT_FOUND);
    agency.status = AgencyStatus.SUSPENDED;
    const saved = await agency.save();
    await this.log(
      adminId,
      'SUSPEND_AGENCY',
      'AGENCY',
      agencyId,
      this.agencyName(agency),
    );
    return this.normalizeAgency(saved);
  }

  async activateAgency(
    adminId: string,
    agencyId: string,
  ): Promise<AgencyDocument> {
    const agency = await this.agencyModel.findById(agencyId).exec();
    if (!agency)
      throw new InternalServerErrorException(Message.AGENCY_NOT_FOUND);
    agency.status = AgencyStatus.ACTIVE;
    const saved = await agency.save();
    await this.log(
      adminId,
      'ACTIVATE_AGENCY',
      'AGENCY',
      agencyId,
      this.agencyName(agency),
    );
    return this.normalizeAgency(saved);
  }

  async deleteAgency(
    adminId: string,
    agencyId: string,
  ): Promise<AgencyDocument> {
    const agency = await this.agencyModel.findById(agencyId).exec();
    if (!agency)
      throw new InternalServerErrorException(Message.AGENCY_NOT_FOUND);
    const name = this.agencyName(agency);
    const result = await this.agencyService.delete(agencyId);
    await this.log(adminId, 'DELETE_AGENCY', 'AGENCY', agencyId, name);
    return this.normalizeAgency(result);
  }

  async banUser(adminId: string, userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new InternalServerErrorException(Message.USER_NOT_FOUND);
    user.status = UserStatus.BANNED;
    const saved = await user.save();
    await this.log(
      adminId,
      'BAN_USER',
      'USER',
      userId,
      `${user.firstName} ${user.lastName}`,
    );
    return saved;
  }

  async unbanUser(adminId: string, userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new InternalServerErrorException(Message.USER_NOT_FOUND);
    user.status = UserStatus.ACTIVE;
    const saved = await user.save();
    await this.log(
      adminId,
      'UNBAN_USER',
      'USER',
      userId,
      `${user.firstName} ${user.lastName}`,
    );
    return saved;
  }

  async deleteUser(adminId: string, userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new InternalServerErrorException(Message.USER_NOT_FOUND);

    // Agency egasini o'chirish Agency.owner'ni osilib qoldirib, o'sha agency'ni
    // butunlay boshqarib bo'lmaydigan holga keltiradi — avval agency topshirilishi
    // yoki o'chirilishi kerak.
    const ownsAgency = await this.agencyModel.exists({ owner: user._id });
    if (ownsAgency) throw new BadRequestException(Message.USER_OWNS_AGENCY);

    const userObjectId = user._id;
    await this.followModel.deleteMany({ user: userObjectId }).exec();
    await this.likeModel.deleteMany({ user: userObjectId }).exec();
    await this.viewModel.deleteMany({ viewer: userObjectId }).exec();

    const result = await this.userModel.findByIdAndDelete(userId).exec();
    if (!result) throw new InternalServerErrorException(Message.USER_NOT_FOUND);
    await this.log(
      adminId,
      'DELETE_USER',
      'USER',
      userId,
      `${result.firstName} ${result.lastName}`,
    );
    return result;
  }

  async updateReviewStatus(
    adminId: string,
    reviewId: string,
    status: ReviewStatus,
    reason?: string,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    review.status = status;
    const saved = await review.save();

    await this.recalculateReviewStats(
      saved.agency.toString(),
      saved.service?.toString(),
    );
    await this.log(
      adminId,
      `REVIEW_${status}`,
      'REVIEW',
      reviewId,
      undefined,
      reason,
    );

    if (status === ReviewStatus.APPROVED) {
      const agency = await this.agencyModel.findById(saved.agency).exec();
      if (agency?.owner) {
        await this.notificationService.notify({
          recipient: agency.owner.toString(),
          type: NotificationType.NEW_REVIEW,
          message: `Your agency received a new ${saved.rating}-star review`,
          targetId: reviewId,
          targetType: 'Review',
        });
      }
    }

    return saved;
  }

  private async recalculateReviewStats(
    agencyId: string,
    serviceId?: string,
  ): Promise<void> {
    const [agencyStats] = await this.reviewModel.aggregate([
      {
        $match: {
          agency: new Types.ObjectId(agencyId),
          status: ReviewStatus.APPROVED,
        },
      },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    await this.agencyModel
      .findByIdAndUpdate(agencyId, {
        averageRating: parseFloat((agencyStats?.avg ?? 0).toFixed(1)),
        totalReviews: agencyStats?.count ?? 0,
      })
      .exec();

    if (!serviceId) return;

    const [serviceStats] = await this.reviewModel.aggregate([
      {
        $match: {
          service: new Types.ObjectId(serviceId),
          status: ReviewStatus.APPROVED,
        },
      },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    await this.serviceModel
      .findByIdAndUpdate(serviceId, {
        averageRating: parseFloat((serviceStats?.avg ?? 0).toFixed(1)),
        totalReviews: serviceStats?.count ?? 0,
      })
      .exec();
  }

  private agencyName(agency: any): string {
    return (
      agency?.name?.en ||
      agency?.name?.uz ||
      agency?.name?.ru ||
      'Unknown Agency'
    );
  }
}
