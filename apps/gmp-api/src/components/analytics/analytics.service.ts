import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AgencyStat, AgencyStatDocument } from '../../schemas/AgencyStat.model';
import {
  ServiceStat,
  ServiceStatDocument,
} from '../../schemas/ServiceStat.model';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AgencyStat.name)
    private agencyStatModel: Model<AgencyStatDocument>,
    @InjectModel(ServiceStat.name)
    private serviceStatModel: Model<ServiceStatDocument>,
  ) {}

  async getAgencyStats(
    agencyId: string,
    from?: Date,
    to?: Date,
  ): Promise<AgencyStatDocument[]> {
    const query: any = { agency: new Types.ObjectId(agencyId) };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }
    return this.agencyStatModel.find(query).sort({ date: -1 }).exec();
  }

  async getServiceStats(
    serviceId: string,
    from?: Date,
    to?: Date,
  ): Promise<ServiceStatDocument[]> {
    const query: any = { service: new Types.ObjectId(serviceId) };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }
    return this.serviceStatModel.find(query).sort({ date: -1 }).exec();
  }

  async recordAgencyProfileView(agencyId: string): Promise<void> {
    const today = this.getTodayDate();
    await this.agencyStatModel
      .findOneAndUpdate(
        { agency: new Types.ObjectId(agencyId), date: today },
        { $inc: { profileViews: 1 } },
        { upsert: true, new: true },
      )
      .exec();
  }

  async recordServiceView(serviceId: string): Promise<void> {
    const today = this.getTodayDate();
    await this.serviceStatModel
      .findOneAndUpdate(
        { service: new Types.ObjectId(serviceId), date: today },
        { $inc: { views: 1 } },
        { upsert: true, new: true },
      )
      .exec();
  }

  async updateAgencyDailyStats(
    agencyId: string,
    data: Partial<AgencyStat>,
  ): Promise<void> {
    const today = this.getTodayDate();
    await this.agencyStatModel
      .findOneAndUpdate(
        { agency: new Types.ObjectId(agencyId), date: today },
        { $set: data },
        { upsert: true, new: true },
      )
      .exec();
  }

  private getTodayDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
