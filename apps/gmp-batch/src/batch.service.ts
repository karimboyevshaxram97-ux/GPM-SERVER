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

  // :00 — Barcha rankni 0 ga tushirish
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

  // :20 — Agency ranking hisoblash
  // Formula: totalServices×5 + totalReviews×3 + averageRating×10
  @Cron('20 * * * * *')
  async batchTopAgencies(): Promise<void> {
    try {
      const agencies = await this.agencyModel.find().exec();

      await Promise.all(
        agencies.map((agency) => {
          const rank =
            agency.totalServices * 5 +
            agency.totalReviews * 3 +
            Math.round(agency.averageRating * 10);
          return this.agencyModel
            .updateOne({ _id: agency._id }, { agencyRank: rank })
            .exec();
        }),
      );

      this.logger.log(`[TopAgencies] ${agencies.length} ta agency rank yangilandi`);
    } catch (err) {
      this.logger.error('[TopAgencies] failed', err);
    }
  }

  // :40 — Service ranking hisoblash
  // Formula: currentApplicationCount×5 + totalReviews×3 + averageRating×10
  @Cron('40 * * * * *')
  async batchTopServices(): Promise<void> {
    try {
      const services = await this.serviceModel.find().exec();

      await Promise.all(
        services.map((service) => {
          const rank =
            service.currentApplicationCount * 5 +
            service.totalReviews * 3 +
            Math.round(service.averageRating * 10);
          return this.serviceModel
            .updateOne({ _id: service._id }, { serviceRank: rank })
            .exec();
        }),
      );

      this.logger.log(`[TopServices] ${services.length} ta service rank yangilandi`);
    } catch (err) {
      this.logger.error('[TopServices] failed', err);
    }
  }
}
