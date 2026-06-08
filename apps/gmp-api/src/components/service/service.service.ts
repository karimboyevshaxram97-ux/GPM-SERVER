import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from '../../schemas/Service.model';
import { CreateServiceInput, UpdateServiceInput } from '../../libs/dto/service/service.input';
import { ServicesInquiryInput } from '../../libs/dto/service/services-inquiry.input';
import { ServicesInquiryResult } from '../../libs/dto/service/services-inquiry.result';
import { Direction, ServiceStatus, ServiceVisibility } from '../../libs/enums';

@Injectable()
export class ServiceService {
  constructor(@InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>) {}

  async getServices(input: ServicesInquiryInput): Promise<ServicesInquiryResult> {
    const {
      text,
      serviceType,
      destinationCountry,
      sourceCountry,
      agencyId,
      status,
      minPrice,
      maxPrice,
      sort,
      direction,
      page,
      limit,
    } = input;

    const match: Record<string, any> = {
      visibility: ServiceVisibility.PUBLIC,
      status: status ?? ServiceStatus.ACTIVE,
    };

    if (text) {
      match.$or = [
        { name: { $regex: text, $options: 'i' } },
        { description: { $regex: text, $options: 'i' } },
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

    const result = await this.serviceModel.aggregate<ServicesInquiryResult>([
      { $match: match },
      {
        $lookup: {
          from: 'agencies',
          localField: 'agency',
          foreignField: '_id',
          as: 'agencyInfo',
          pipeline: [{ $project: { name: 1, logo: 1, slug: 1, verificationStatus: 1 } }],
        },
      },
      { $sort: { [sort]: sortDir } },
      {
        $facet: {
          list: [{ $skip: skip }, { $limit: limit }],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    return result[0];
  }

  async findById(id: string): Promise<ServiceDocument | null> {
    return this.serviceModel.findById(id).exec();
  }

  async findByAgency(agencyId: string): Promise<ServiceDocument[]> {
    return this.serviceModel.find({ agency: new Types.ObjectId(agencyId) }).exec();
  }

  async create(input: CreateServiceInput, agencyId: string): Promise<ServiceDocument> {
    const service = new this.serviceModel({
      ...input,
      agency: new Types.ObjectId(agencyId),
    });
    return service.save();
  }

  async update(id: string, input: UpdateServiceInput): Promise<ServiceDocument | null> {
    return this.serviceModel.findByIdAndUpdate(id, input, { new: true }).exec();
  }

  async delete(id: string): Promise<ServiceDocument | null> {
    return this.serviceModel.findByIdAndDelete(id).exec();
  }

  async incrementField(id: string | Types.ObjectId, field: string, amount = 1): Promise<void> {
    await this.serviceModel
      .findByIdAndUpdate(id, { $inc: { [field]: amount } })
      .exec();
  }
}
