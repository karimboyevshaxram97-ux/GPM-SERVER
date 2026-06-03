import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';

@Injectable()
export class ReviewService {
  constructor(@InjectModel(Review.name) private reviewModel: Model<ReviewDocument>) {}

  async findAll(): Promise<ReviewDocument[]> {
    return this.reviewModel.find().exec();
  }

  async findByAgency(agencyId: string): Promise<ReviewDocument[]> {
    return this.reviewModel.find({ agency: new Types.ObjectId(agencyId) }).exec();
  }

  async findByService(serviceId: string): Promise<ReviewDocument[]> {
    return this.reviewModel.find({ service: new Types.ObjectId(serviceId) }).exec();
  }

  async create(reviewData: any, userId: string, agencyId: string, serviceId?: string): Promise<ReviewDocument> {
    const review = new this.reviewModel({
      ...reviewData,
      user: new Types.ObjectId(userId),
      agency: new Types.ObjectId(agencyId),
      service: serviceId ? new Types.ObjectId(serviceId) : undefined,
    });
    return review.save();
  }

  async update(id: string, reviewData: any): Promise<ReviewDocument | null> {
    return this.reviewModel.findByIdAndUpdate(id, reviewData, { new: true }).exec();
  }
}
