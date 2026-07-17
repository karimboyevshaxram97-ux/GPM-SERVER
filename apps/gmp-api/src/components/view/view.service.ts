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
    anonymousViewerId?: string,
  ): Promise<number> {
    const normalizedAnonymousId = anonymousViewerId?.trim().slice(0, 128);
    const identityFilter = viewerId
      ? { viewer: new Types.ObjectId(viewerId) }
      : normalizedAnonymousId
        ? { anonymousViewerId: normalizedAnonymousId }
        : null;

    if (identityFilter) {
      try {
        const result = await this.viewModel
          .updateOne(
            {
              ...identityFilter,
              targetId: new Types.ObjectId(targetId),
              targetType,
            },
            {
              $setOnInsert: {
                ...identityFilter,
                targetId: new Types.ObjectId(targetId),
                targetType,
              },
            },
            { upsert: true },
          )
          .exec();

        // Registered yoki doimiy anonymous viewer target uchun faqat bir marta sanaladi.
        // Detail query va recordView mutation bir vaqtda chaqirilsa ham faqat upsert
        // orqali yangi hujjat yaratgan request counter'ni oshiradi.
        if (result.upsertedCount === 0) {
          return this.getViewCount(targetId, targetType);
        }
      } catch (err: any) {
        // Ikki parallel upsert bir paytda yangi hujjat yaratishga urinsa unique index
        // ulardan bittasini E11000 bilan to'xtatadi; bu qayta view, xato emas.
        if (err?.code === 11000) {
          return this.getViewCount(targetId, targetType);
        }
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
