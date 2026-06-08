import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agency, AgencyDocument } from './schemas/Agency.model';
import { Service, ServiceDocument } from './schemas/Service.model';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(
    @InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  getStatus() {
    return { status: 'GMP Batch alive', timestamp: new Date() };
  }

  // :00 — Reset all ranks to 0
  @Cron('0 * * * * *')
  async batchRollback(): Promise<void> {
    try {
      const [agencies, services] = await Promise.all([
        this.agencyModel.updateMany({}, { agencyRank: 0 }),
        this.serviceModel.updateMany({}, { serviceRank: 0 }),
      ]);
      this.logger.log(
        `[Rollback] agencies: ${agencies.modifiedCount}, services: ${services.modifiedCount}`,
      );
    } catch (err) {
      this.logger.error('[Rollback] failed', err);
    }
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
}
