import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agency, AgencyDocument } from './schemas/Agency.model';
import { Service, ServiceDocument } from './schemas/Service.model';
import { AgencySubscription, AgencySubscriptionDocument } from './schemas/AgencySubscription.model';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(
    @InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(AgencySubscription.name) private agencySubscriptionModel: Model<AgencySubscriptionDocument>,
  ) {}

  getStatus() {
    return { status: 'GMP Batch alive', timestamp: new Date() };
  }

  // :20 — Agency ranking
  // Formula: totalServices×5 + totalReviews×3 + averageRating×10 + likeCount×2 + viewCount×1
  @Cron('20 * * * * *')
  async batchTopAgencies(): Promise<void> {
    try {
      const result = await this.agencyModel.updateMany(
        {},
        [
          {
            $set: {
              agencyRank: {
                $add: [
                  { $multiply: ['$totalServices', 5] },
                  { $multiply: ['$totalReviews', 3] },
                  { $multiply: [{ $ifNull: ['$averageRating', 0] }, 10] },
                  { $multiply: [{ $ifNull: ['$likeCount', 0] }, 2] },
                  { $ifNull: ['$viewCount', 0] },
                ],
              },
            },
          },
        ],
      );
      this.logger.log(`[TopAgencies] ${result.modifiedCount} agencies ranked`);
    } catch (err) {
      this.logger.error('[TopAgencies] failed', err);
    }
  }

  // :40 — Service ranking
  // Formula: currentApplicationCount×5 + totalReviews×3 + averageRating×10 + likeCount×2 + viewCount×1
  @Cron('40 * * * * *')
  async batchTopServices(): Promise<void> {
    try {
      const result = await this.serviceModel.updateMany(
        {},
        [
          {
            $set: {
              serviceRank: {
                $add: [
                  { $multiply: [{ $ifNull: ['$currentApplicationCount', 0] }, 5] },
                  { $multiply: [{ $ifNull: ['$totalReviews', 0] }, 3] },
                  { $multiply: [{ $ifNull: ['$averageRating', 0] }, 10] },
                  { $multiply: [{ $ifNull: ['$likeCount', 0] }, 2] },
                  { $ifNull: ['$viewCount', 0] },
                ],
              },
            },
          },
        ],
      );
      this.logger.log(`[TopServices] ${result.modifiedCount} services ranked`);
    } catch (err) {
      this.logger.error('[TopServices] failed', err);
    }
  }

  // Har kuni 00:00 — muddati o'tgan (endDate < now) faol obunalarni EXPIRED qilib,
  // Agency.subscriptionStatus'ni ham sinxronlaydi (gmp-api SubscriptionService bilan
  // bir xil 'agencysubscriptions'/'agencies' kolleksiyalariga yozadi).
  @Cron('0 0 * * *')
  async batchExpireSubscriptions(): Promise<void> {
    try {
      const now = new Date();
      const overdue = await this.agencySubscriptionModel
        .find({ status: 'ACTIVE', endDate: { $lt: now } })
        .select('_id agency')
        .exec();

      if (!overdue.length) {
        this.logger.log('[ExpireSubscriptions] nothing to expire');
        return;
      }

      const subscriptionIds = overdue.map((sub) => sub._id);
      const agencyIds = overdue.map((sub) => sub.agency);

      await this.agencySubscriptionModel
        .updateMany({ _id: { $in: subscriptionIds } }, { status: 'EXPIRED' })
        .exec();
      await this.agencyModel
        .updateMany({ _id: { $in: agencyIds } }, { subscriptionStatus: 'EXPIRED' })
        .exec();

      this.logger.log(`[ExpireSubscriptions] ${subscriptionIds.length} subscriptions expired`);
    } catch (err) {
      this.logger.error('[ExpireSubscriptions] failed', err);
    }
  }
}
