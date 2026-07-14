import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Review,
  ReviewDocument,
  BLOCKING_REVIEW_STATUSES,
} from '../../schemas/Review.model';
import { AgencyService } from '../agency/agency.service';
import { ServiceService } from '../service/service.service';
import { CreateReviewInput } from '../../libs/dto/review/review.input';
import { Message } from '../../libs';
import { ReviewStatus } from '../../libs/enums';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private readonly agencyService: AgencyService,
    private readonly serviceService: ServiceService,
  ) {}

  async findAll(): Promise<ReviewDocument[]> {
    return this.reviewModel.find().exec();
  }

  async findByAgency(agencyId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({
        agency: new Types.ObjectId(agencyId),
        status: ReviewStatus.APPROVED,
      })
      .exec();
  }

  async findByService(serviceId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({
        service: new Types.ObjectId(serviceId),
        status: ReviewStatus.APPROVED,
      })
      .exec();
  }

  async existsByUserAndTarget(
    userId: string,
    agencyId: string,
    serviceId?: string,
  ): Promise<boolean> {
    const query: any = {
      user: new Types.ObjectId(userId),
      agency: new Types.ObjectId(agencyId),
      status: { $in: BLOCKING_REVIEW_STATUSES },
    };
    if (serviceId) query.service = new Types.ObjectId(serviceId);
    else query.service = { $exists: false };

    return !!(await this.reviewModel.exists(query));
  }

  async create(
    input: CreateReviewInput,
    userId: string,
  ): Promise<ReviewDocument> {
    try {
      const review = new this.reviewModel({
        rating: input.rating,
        comment: input.comment,
        user: new Types.ObjectId(userId),
        agency: new Types.ObjectId(input.agencyId),
        service: input.serviceId
          ? new Types.ObjectId(input.serviceId)
          : undefined,
      });
      const saved = await review.save();

      await this.recalculateAgencyStats(input.agencyId);
      if (input.serviceId) await this.recalculateServiceStats(input.serviceId);

      return saved;
    } catch (err: any) {
      console.log('Error, ReviewService.create:', err.message);
      if (err?.code === 11000) {
        throw new BadRequestException(Message.ALREADY_EXISTS);
      }
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  async update(id: string, reviewData: any): Promise<ReviewDocument | null> {
    return this.reviewModel
      .findByIdAndUpdate(id, reviewData, { new: true })
      .exec();
  }

  private async recalculateAgencyStats(agencyId: string): Promise<void> {
    const [stats] = await this.reviewModel.aggregate([
      {
        $match: {
          agency: new Types.ObjectId(agencyId),
          status: ReviewStatus.APPROVED,
        },
      },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await this.agencyService.updateReviewStats(
      agencyId,
      parseFloat((stats?.avg ?? 0).toFixed(1)),
      stats?.count ?? 0,
    );
  }

  private async recalculateServiceStats(serviceId: string): Promise<void> {
    const [stats] = await this.reviewModel.aggregate([
      {
        $match: {
          service: new Types.ObjectId(serviceId),
          status: ReviewStatus.APPROVED,
        },
      },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await this.serviceService.updateReviewStats(
      serviceId,
      parseFloat((stats?.avg ?? 0).toFixed(1)),
      stats?.count ?? 0,
    );
  }
}
