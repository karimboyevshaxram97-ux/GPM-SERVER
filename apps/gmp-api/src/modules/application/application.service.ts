import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument } from './schemas/application.schema';

@Injectable()
export class ApplicationService {
  constructor(@InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>) {}

  async findAll(filter?: any): Promise<ApplicationDocument[]> {
    return this.applicationModel.find(filter || {}).exec();
  }

  async findById(id: string): Promise<ApplicationDocument | null> {
    return this.applicationModel.findById(id).exec();
  }

  async findByUser(userId: string): Promise<ApplicationDocument[]> {
    return this.applicationModel.find({ user: new Types.ObjectId(userId) }).exec();
  }

  async findByAgency(agencyId: string): Promise<ApplicationDocument[]> {
    return this.applicationModel.find({ agency: new Types.ObjectId(agencyId) }).exec();
  }

  async findByService(serviceId: string): Promise<ApplicationDocument[]> {
    return this.applicationModel.find({ service: new Types.ObjectId(serviceId) }).exec();
  }

  async create(applicationData: any, userId: string, serviceId: string, agencyId: string): Promise<ApplicationDocument> {
    const application = new this.applicationModel({
      ...applicationData,
      user: new Types.ObjectId(userId),
      service: new Types.ObjectId(serviceId),
      agency: new Types.ObjectId(agencyId),
      appliedAt: new Date(),
    });
    return application.save();
  }

  async update(id: string, applicationData: any): Promise<ApplicationDocument | null> {
    return this.applicationModel.findByIdAndUpdate(id, applicationData, { new: true }).exec();
  }

  async delete(id: string): Promise<ApplicationDocument | null> {
    return this.applicationModel.findByIdAndDelete(id).exec();
  }
}
