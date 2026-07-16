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
import {
  Review,
  ReviewDocument,
  BLOCKING_REVIEW_STATUSES,
} from '../../schemas/Review.model';
import { Service, ServiceDocument } from '../../schemas/Service.model';
import { AuditLog, AuditLogDocument } from '../../schemas/AuditLog.model';
import { Follow, FollowDocument } from '../../schemas/Follow.model';
import { Like, LikeDocument } from '../../schemas/Like.model';
import { View, ViewDocument } from '../../schemas/View.model';
import {
  ApplicationDocument as ApplicationDocumentEntity,
  ApplicationDocumentRecord,
} from '../../schemas/ApplicationDocument.model';
import {
  Conversation,
  ConversationDocument,
} from '../../schemas/Conversation.model';
import {
  Message as MessageEntity,
  MessageDocument,
} from '../../schemas/Message.model';
import {
  Notification,
  NotificationDocument,
} from '../../schemas/Notification.model';
import {
  PhotoComment,
  PhotoCommentDocument,
} from '../../schemas/PhotoComment.model';
import {
  SupportTicket,
  SupportTicketDocument,
} from '../../schemas/SupportTicket.model';
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
  UserRole,
  ApplicationStatus,
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
    @InjectModel(ApplicationDocumentEntity.name)
    private applicationDocumentModel: Model<ApplicationDocumentRecord>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(MessageEntity.name)
    private messageModel: Model<MessageDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(PhotoComment.name)
    private photoCommentModel: Model<PhotoCommentDocument>,
    @InjectModel(SupportTicket.name)
    private supportTicketModel: Model<SupportTicketDocument>,
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
    if (user.role === UserRole.SUPER_ADMIN)
      throw new BadRequestException(Message.CANNOT_MODIFY_SUPER_ADMIN);
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
    if (user.role === UserRole.SUPER_ADMIN)
      throw new BadRequestException(Message.CANNOT_MODIFY_SUPER_ADMIN);
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
    if (user.role === UserRole.SUPER_ADMIN)
      throw new BadRequestException(Message.CANNOT_MODIFY_SUPER_ADMIN);

    // Agency egasini o'chirish Agency.owner'ni osilib qoldirib, o'sha agency'ni
    // butunlay boshqarib bo'lmaydigan holga keltiradi — avval agency topshirilishi
    // yoki o'chirilishi kerak.
    const ownsAgency = await this.agencyModel.exists({ owner: user._id });
    if (ownsAgency) throw new BadRequestException(Message.USER_OWNS_AGENCY);

    const userObjectId = user._id;
    const applications = await this.applicationModel
      .find({ user: userObjectId })
      .select('_id service status')
      .lean()
      .exec();
    const applicationIds = applications.map((application) => application._id);

    if (applicationIds.length) {
      await this.applicationDocumentModel
        .deleteMany({ application: { $in: applicationIds } })
        .exec();
    }
    await this.applicationDocumentModel
      .deleteMany({ user: userObjectId })
      .exec();

    const slotCounts = new Map<string, number>();
    for (const application of applications) {
      if (
        application.status === ApplicationStatus.REJECTED ||
        application.status === ApplicationStatus.WITHDRAWN
      )
        continue;
      const serviceId = application.service?.toString();
      if (serviceId)
        slotCounts.set(serviceId, (slotCounts.get(serviceId) ?? 0) + 1);
    }
    for (const [serviceId, count] of slotCounts) {
      await this.serviceModel
        .findByIdAndUpdate(serviceId, [
          {
            $set: {
              currentApplicationCount: {
                $max: [0, { $subtract: ['$currentApplicationCount', count] }],
              },
            },
          },
        ])
        .exec();
    }

    await this.applicationModel.deleteMany({ user: userObjectId }).exec();

    const reviews = await this.reviewModel
      .find({ user: userObjectId })
      .select('agency service')
      .lean()
      .exec();
    await this.reviewModel.deleteMany({ user: userObjectId }).exec();
    const affectedReviewTargets = new Map<
      string,
      { agencyId: string; serviceId?: string }
    >();
    for (const review of reviews) {
      const agencyId = review.agency?.toString();
      if (!agencyId) continue;
      const serviceId = review.service?.toString();
      affectedReviewTargets.set(`${agencyId}:${serviceId ?? ''}`, {
        agencyId,
        serviceId,
      });
    }
    for (const { agencyId, serviceId } of affectedReviewTargets.values()) {
      await this.recalculateReviewStats(agencyId, serviceId);
    }

    const comments = await this.photoCommentModel
      .find({ user: userObjectId })
      .select('_id')
      .lean()
      .exec();
    const commentIds = comments.map((comment) => comment._id);
    if (commentIds.length) {
      await this.photoCommentModel
        .updateMany(
          { parentComment: { $in: commentIds } },
          { $unset: { parentComment: 1 } },
        )
        .exec();
    }
    await this.photoCommentModel.deleteMany({ user: userObjectId }).exec();

    const conversations = await this.conversationModel
      .find({ participants: userObjectId })
      .select('_id')
      .lean()
      .exec();
    const conversationIds = conversations.map(
      (conversation) => conversation._id,
    );
    if (conversationIds.length) {
      await this.messageModel
        .deleteMany({ conversation: { $in: conversationIds } })
        .exec();
      await this.conversationModel
        .deleteMany({ _id: { $in: conversationIds } })
        .exec();
    }
    await this.messageModel.deleteMany({ sender: userObjectId }).exec();

    await this.notificationModel.deleteMany({ recipient: userObjectId }).exec();
    await this.notificationModel
      .updateMany({ sender: userObjectId }, { $unset: { sender: 1 } })
      .exec();
    await this.supportTicketModel
      .updateMany({ user: userObjectId }, { $unset: { user: 1 } })
      .exec();
    await this.agencyModel
      .updateMany({ admins: userObjectId }, { $pull: { admins: userObjectId } })
      .exec();
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
          status: { $in: BLOCKING_REVIEW_STATUSES },
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
