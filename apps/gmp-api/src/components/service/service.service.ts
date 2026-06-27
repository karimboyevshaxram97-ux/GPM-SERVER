import { Injectable, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Service, ServiceDocument } from '../../schemas/Service.model';
import { CreateServiceInput, UpdateServiceInput } from '../../libs/dto/service/service.input';
import { ServicesInquiryInput } from '../../libs/dto/service/services-inquiry.input';
import { ServicesInquiryResult } from '../../libs/dto/service/services-inquiry.result';
import {
  AgencyStatus,
  AgencyVerificationStatus,
  Direction,
  ServiceStatus,
  ServiceVisibility,
  LikeTargetType,
  ViewTargetType,
} from '../../libs/enums';
import { Message, T, StatisticModifier } from '../../libs';
import { lookupAuthUserLiked } from '../../libs/config/aggregation';
import { ViewService } from '../view/view.service';

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
    private readonly viewService: ViewService,
  ) {}

  async getServices(input: ServicesInquiryInput, userId?: string, canViewRestricted = false): Promise<ServicesInquiryResult> {
    const {
      text,
      serviceType,
      destinationCountry,
      sourceCountry,
      agencyId,
      status,
      visibility,
      includeInactive,
      minPrice,
      maxPrice,
      sort,
      direction,
      page,
      limit,
    } = input;

    const match: T = {};

    if (canViewRestricted) {
      if (visibility) match.visibility = visibility;
      else if (!includeInactive) match.visibility = ServiceVisibility.PUBLIC;

      if (status) match.status = status;
      else if (!includeInactive) match.status = ServiceStatus.ACTIVE;
    } else {
      match.visibility = ServiceVisibility.PUBLIC;
      match.status = ServiceStatus.ACTIVE;
    }

    if (text) {
      match.$or = [
        { 'name.uz': { $regex: text, $options: 'i' } },
        { 'name.ru': { $regex: text, $options: 'i' } },
        { 'name.en': { $regex: text, $options: 'i' } },
        { 'name.ko': { $regex: text, $options: 'i' } },
        { 'description.uz': { $regex: text, $options: 'i' } },
        { keywords: { $elemMatch: { $regex: text, $options: 'i' } } },
      ];
    }
    if (serviceType) match.serviceType = serviceType;
    if (destinationCountry) match.destinationCountry = destinationCountry;
    if (sourceCountry) match.sourceCountries = sourceCountry;
    if (agencyId) match.agency = new Types.ObjectId(agencyId);

    if (minPrice !== undefined || maxPrice !== undefined) {
      match.price = {};
      if (minPrice !== undefined) match.price.$gte = minPrice;
      if (maxPrice !== undefined) match.price.$lte = maxPrice;
    }

    const sortDir = direction === Direction.ASC ? 1 : -1;
    const skip = (page - 1) * limit;
    const userObjId = userId ? new Types.ObjectId(userId) : null;

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: 'agencies',
          localField: 'agency',
          foreignField: '_id',
          as: 'agencyInfo',
          pipeline: [{ $project: { name: 1, logo: 1, slug: 1, status: 1, verificationStatus: 1 } }],
        },
      },
    ];

    if (!canViewRestricted) {
      pipeline.push({
        $match: {
          'agencyInfo.status': AgencyStatus.ACTIVE,
          'agencyInfo.verificationStatus': AgencyVerificationStatus.VERIFIED,
        },
      });
    }

    pipeline.push(
      { $sort: { [sort]: sortDir } },
      {
        $facet: {
          list: [
            { $skip: skip },
            { $limit: limit },
            lookupAuthUserLiked(userObjId, '$_id', LikeTargetType.SERVICE),
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    );

    const result = await this.serviceModel.aggregate<ServicesInquiryResult>(pipeline);

    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return result[0];
  }

  async getServiceDetail(id: string, userId?: string, canViewRestricted = false): Promise<ServiceDocument | null> {
    const userObjId = userId ? new Types.ObjectId(userId) : null;

    const result = await this.serviceModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      lookupAuthUserLiked(userObjId, '$_id', LikeTargetType.SERVICE),
    ]);

    if (!result.length) throw new InternalServerErrorException(Message.SERVICE_NOT_FOUND);
    if (
      !canViewRestricted &&
      (result[0].status !== ServiceStatus.ACTIVE || result[0].visibility !== ServiceVisibility.PUBLIC)
    ) {
      throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
    }

    await this.viewService.recordView(id, ViewTargetType.SERVICE, userId);
    return result[0];
  }

  async findById(id: string): Promise<ServiceDocument | null> {
    return this.serviceModel.findById(id).exec();
  }

  async findByAgency(agencyId: string): Promise<ServiceDocument[]> {
    return this.serviceModel.find({ agency: new Types.ObjectId(agencyId) }).exec();
  }

  async findPublicByAgency(agencyId: string): Promise<ServiceDocument[]> {
    return this.serviceModel
      .find({
        agency: new Types.ObjectId(agencyId),
        status: ServiceStatus.ACTIVE,
        visibility: ServiceVisibility.PUBLIC,
      })
      .exec();
  }

  async create(input: CreateServiceInput, agencyId: string): Promise<ServiceDocument> {
    try {
      return await this.serviceModel.create({
        ...input,
        agency: new Types.ObjectId(agencyId),
      });
    } catch (err: any) {
      console.log('Error, ServiceService.create:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  async update(id: string, input: UpdateServiceInput): Promise<ServiceDocument> {
    const result = await this.serviceModel.findByIdAndUpdate(id, input, { new: true }).exec();
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  async delete(id: string): Promise<ServiceDocument> {
    const result = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
    return result;
  }

  async serviceStatsEditor(input: StatisticModifier): Promise<ServiceDocument | null> {
    const { _id, targetKey, modifier } = input;
    return this.serviceModel
      .findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true })
      .exec();
  }

  async updateReviewStats(id: string, averageRating: number, totalReviews: number): Promise<void> {
    await this.serviceModel.findByIdAndUpdate(id, { averageRating, totalReviews }).exec();
  }
}
