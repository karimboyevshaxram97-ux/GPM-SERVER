import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Agency, AgencyDocument } from '../../schemas/Agency.model';
import { CreateAgencyInput, UpdateAgencyInput } from '../../libs/dto/agency/agency.input';
import { AgenciesInquiryInput } from '../../libs/dto/agency/agencies-inquiry.input';
import { AgenciesInquiryResult } from '../../libs/dto/agency/agencies-inquiry.result';
import { Direction } from '../../libs/enums';

@Injectable()
export class AgencyService {
  constructor(@InjectModel(Agency.name) private readonly agencyModel: Model<AgencyDocument>) {}

  async getAgencies(input: AgenciesInquiryInput): Promise<AgenciesInquiryResult> {
    const { text, status, verificationStatus, country, sort, direction, page, limit } = input;

    const match: Record<string, any> = {};

    if (text) {
      match.$or = [
        { name: { $regex: text, $options: 'i' } },
        { description: { $regex: text, $options: 'i' } },
        { email: { $regex: text, $options: 'i' } },
      ];
    }
    if (status) match.status = status;
    if (verificationStatus) match.verificationStatus = verificationStatus;
    if (country) match.operatingCountries = country;

    const sortDir = direction === Direction.ASC ? 1 : -1;
    const skip = (page - 1) * limit;

    const result = await this.agencyModel.aggregate<AgenciesInquiryResult>([
      { $match: match },
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

  async findById(id: string): Promise<AgencyDocument | null> {
    return this.agencyModel.findById(id).exec();
  }

  async findBySlug(slug: string): Promise<AgencyDocument | null> {
    return this.agencyModel.findOne({ slug }).exec();
  }

  async create(input: CreateAgencyInput, userId: string): Promise<AgencyDocument> {
    const slug = input.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const agency = new this.agencyModel({
      ...input,
      slug,
      owner: new Types.ObjectId(userId),
      admins: [new Types.ObjectId(userId)],
    });
    return agency.save();
  }

  async update(id: string, input: UpdateAgencyInput): Promise<AgencyDocument | null> {
    return this.agencyModel.findByIdAndUpdate(id, input, { new: true }).exec();
  }

  async delete(id: string): Promise<AgencyDocument | null> {
    return this.agencyModel.findByIdAndDelete(id).exec();
  }

  async incrementField(id: string | Types.ObjectId, field: string, amount = 1): Promise<void> {
    await this.agencyModel
      .findByIdAndUpdate(id, { $inc: { [field]: amount } })
      .exec();
  }
}
