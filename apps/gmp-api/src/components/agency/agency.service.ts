import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Agency, AgencyDocument } from '../../schemas/Agency.model';
import { CreateAgencyInput, UpdateAgencyInput } from '../../libs/dto/agency/agency.input';
import { AgenciesInquiryInput } from '../../libs/dto/agency/agencies-inquiry.input';
import { AgenciesInquiryResult } from '../../libs/dto/agency/agencies-inquiry.result';
import { Direction } from '../../libs/enums';
import { Message, T, StatisticModifier } from '../../libs';

@Injectable()
export class AgencyService {
  constructor(@InjectModel(Agency.name) private readonly agencyModel: Model<AgencyDocument>) {}

  async getAgencies(input: AgenciesInquiryInput): Promise<AgenciesInquiryResult> {
    const { text, status, verificationStatus, country, sort, direction, page, limit } = input;

    const match: T = {};

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

    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return result[0];
  }

  async findById(id: string): Promise<AgencyDocument | null> {
    return this.agencyModel.findById(id).exec();
  }

  async findBySlug(slug: string): Promise<AgencyDocument | null> {
    return this.agencyModel.findOne({ slug }).exec();
  }

  async create(input: CreateAgencyInput, userId: string): Promise<AgencyDocument> {
    try {
      const slug = input.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      return await this.agencyModel.create({
        ...input,
        slug,
        owner: new Types.ObjectId(userId),
        admins: [new Types.ObjectId(userId)],
      });
    } catch (err: any) {
      console.log('Error, AgencyService.create:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  async update(id: string, input: UpdateAgencyInput): Promise<AgencyDocument> {
    const result = await this.agencyModel.findByIdAndUpdate(id, input, { new: true }).exec();
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  async delete(id: string): Promise<AgencyDocument> {
    const result = await this.agencyModel.findByIdAndDelete(id).exec();
    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
    return result;
  }

  async agencyStatsEditor(input: StatisticModifier): Promise<AgencyDocument | null> {
    const { _id, targetKey, modifier } = input;
    return this.agencyModel
      .findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true })
      .exec();
  }

  async updateReviewStats(id: string, averageRating: number, totalReviews: number): Promise<void> {
    await this.agencyModel.findByIdAndUpdate(id, { averageRating, totalReviews }).exec();
  }
}
