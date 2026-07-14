import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { View, ViewDocument } from '../../schemas/View.model';
import { Agency, AgencyDocument } from '../../schemas/Agency.model';
import { Service, ServiceDocument } from '../../schemas/Service.model';
import { Photo, PhotoDocument } from '../../schemas/Photo.model';
import { ViewTargetType } from '../../libs/enums';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class ViewService {
  constructor(
    @InjectModel(View.name) private readonly viewModel: Model<ViewDocument>,
    @InjectModel(Agency.name)
    private readonly agencyModel: Model<AgencyDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Photo.name) private readonly photoModel: Model<PhotoDocument>,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async recordView(
    targetId: string,
    targetType: ViewTargetType,
    viewerId?: string,
  ): Promise<number> {
    if (viewerId) {
      try {
        await this.viewModel.create({
          viewer: new Types.ObjectId(viewerId),
          targetId: new Types.ObjectId(targetId),
          targetType,
          viewDate: this.today(),
        });
      } catch (err: any) {
        // E11000 — shu viewer bugun shu target'ni allaqachon ko'rgan; hisoblagichni
        // qayta oshirmasdan joriy sonni qaytaramiz. Boshqa xatolar tashlanaveradi.
        if (err?.code === 11000) return this.getViewCount(targetId, targetType);
        throw err;
      }
    } else {
      await this.viewModel.create({
        targetId: new Types.ObjectId(targetId),
        targetType,
      });
    }

    await this.updateViewCount(targetId, targetType);
    return this.getViewCount(targetId, targetType);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async getViewCount(
    targetId: string,
    targetType: ViewTargetType,
  ): Promise<number> {
    return this.viewModel
      .countDocuments({ targetId: new Types.ObjectId(targetId), targetType })
      .exec();
  }

  private async updateViewCount(
    targetId: string,
    targetType: ViewTargetType,
  ): Promise<void> {
    let model: Model<any> = this.serviceModel;
    if (targetType === ViewTargetType.AGENCY) model = this.agencyModel;
    if (targetType === ViewTargetType.PHOTO) model = this.photoModel;
    await model.findByIdAndUpdate(targetId, { $inc: { viewCount: 1 } }).exec();

    // AgencyStat/ServiceStat kunlik tarixiy statistikasini ham to'ldiramiz — bu metodlar
    // avvaldan mavjud edi, lekin hech kim chaqirmasligi sabab kolleksiyalar hech qachon
    // yozilmagan edi.
    if (targetType === ViewTargetType.AGENCY) {
      await this.analyticsService.recordAgencyProfileView(targetId);
    } else if (targetType === ViewTargetType.SERVICE) {
      await this.analyticsService.recordServiceView(targetId);
    }
  }
}
