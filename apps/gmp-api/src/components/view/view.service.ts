import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { View, ViewDocument } from '../../schemas/View.model';
import { Agency, AgencyDocument } from '../../schemas/Agency.model';
import { Service, ServiceDocument } from '../../schemas/Service.model';
import { ViewTargetType } from '../../libs/enums';

@Injectable()
export class ViewService {
  constructor(
    @InjectModel(View.name) private readonly viewModel: Model<ViewDocument>,
    @InjectModel(Agency.name) private readonly agencyModel: Model<AgencyDocument>,
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async recordView(targetId: string, targetType: ViewTargetType, viewerId?: string): Promise<number> {
    if (viewerId) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const alreadyViewed = await this.viewModel
        .exists({
          viewer: new Types.ObjectId(viewerId),
          targetId: new Types.ObjectId(targetId),
          targetType,
          createdAt: { $gte: startOfDay },
        })
        .exec();

      if (alreadyViewed) {
        return this.getViewCount(targetId, targetType);
      }

      await this.viewModel.create({
        viewer: new Types.ObjectId(viewerId),
        targetId: new Types.ObjectId(targetId),
        targetType,
      });
    } else {
      await this.viewModel.create({
        targetId: new Types.ObjectId(targetId),
        targetType,
      });
    }

    await this.updateViewCount(targetId, targetType);
    return this.getViewCount(targetId, targetType);
  }

  async getViewCount(targetId: string, targetType: ViewTargetType): Promise<number> {
    return this.viewModel
      .countDocuments({ targetId: new Types.ObjectId(targetId), targetType })
      .exec();
  }

  private async updateViewCount(targetId: string, targetType: ViewTargetType): Promise<void> {
    const model: Model<any> = targetType === ViewTargetType.AGENCY ? this.agencyModel : this.serviceModel;
    await model.findByIdAndUpdate(targetId, { $inc: { viewCount: 1 } }).exec();
  }
}
