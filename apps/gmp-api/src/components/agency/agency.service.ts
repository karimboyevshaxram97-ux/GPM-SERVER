import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Agency, AgencyDocument } from '../../schemas/Agency.model';

@Injectable()
export class AgencyService {
  constructor(@InjectModel(Agency.name) private agencyModel: Model<AgencyDocument>) {}

  async findAll(): Promise<AgencyDocument[]> {
    return this.agencyModel.find().exec();
  }

  async findById(id: string): Promise<AgencyDocument | null> {
    return this.agencyModel.findById(id).exec();
  }

  async findBySlug(slug: string): Promise<AgencyDocument | null> {
    return this.agencyModel.findOne({ slug }).exec();
  }

  async create(agencyData: any, userId: string): Promise<AgencyDocument> {
    const slug =
      agencyData.slug ||
      (agencyData.name
        ? agencyData.name
            .toString()
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
        : undefined);

    const agency = new this.agencyModel({
      ...agencyData,
      slug,
      owner: new Types.ObjectId(userId),
      admins: [new Types.ObjectId(userId)],
    });
    return agency.save();
  }

  async update(id: string, agencyData: any): Promise<AgencyDocument | null> {
    return this.agencyModel.findByIdAndUpdate(id, agencyData, { new: true }).exec();
  }

  async delete(id: string): Promise<AgencyDocument | null> {
    return this.agencyModel.findByIdAndDelete(id).exec();
  }
}
