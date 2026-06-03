import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';

@Injectable()
export class ServiceService {
  constructor(@InjectModel(Service.name) private serviceModel: Model<ServiceDocument>) {}

  async findAll(filter?: any): Promise<ServiceDocument[]> {
    return this.serviceModel.find(filter || {}).exec();
  }

  async findById(id: string): Promise<ServiceDocument | null> {
    return this.serviceModel.findById(id).exec();
  }

  async findByAgency(agencyId: string): Promise<ServiceDocument[]> {
    return this.serviceModel.find({ agency: new Types.ObjectId(agencyId) }).exec();
  }

  async create(serviceData: any, agencyId: string): Promise<ServiceDocument> {
    const service = new this.serviceModel({
      ...serviceData,
      agency: new Types.ObjectId(agencyId),
    });
    return service.save();
  }

  async update(id: string, serviceData: any): Promise<ServiceDocument | null> {
    return this.serviceModel.findByIdAndUpdate(id, serviceData, { new: true }).exec();
  }

  async delete(id: string): Promise<ServiceDocument | null> {
    return this.serviceModel.findByIdAndDelete(id).exec();
  }

  async search(query: string): Promise<ServiceDocument[]> {
    return this.serviceModel.find({ $text: { $search: query } }).exec();
  }
}
