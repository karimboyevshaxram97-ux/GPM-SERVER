import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument } from '../../schemas/Application.model';
import { CreateApplicationInput, UpdateApplicationInput } from '../../libs/dto/application/application.input';
import { Message, T } from '../../libs';

@Injectable()
export class ApplicationService {
  constructor(@InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>) {}

  async findAll(): Promise<ApplicationDocument[]> {
    return this.applicationModel.find().exec();
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

  async existsForUserAndService(userId: string, serviceId: string): Promise<boolean> {
    const existing = await this.applicationModel.exists({
      user: new Types.ObjectId(userId),
      service: new Types.ObjectId(serviceId),
    });
    return !!existing;
  }

  async create(input: CreateApplicationInput, userId: string, serviceId: string, agencyId: string): Promise<ApplicationDocument> {
    try {
      return await this.applicationModel.create({
        ...input,
        user: new Types.ObjectId(userId),
        service: new Types.ObjectId(serviceId),
        agency: new Types.ObjectId(agencyId),
        appliedAt: new Date(),
      });
    } catch (err: any) {
      console.log('Error, ApplicationService.create:', err.message);
      if (err?.code === 11000) {
        throw new BadRequestException(Message.ALREADY_EXISTS);
      }
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  async update(id: string, input: UpdateApplicationInput): Promise<ApplicationDocument> {
    const result = await this.applicationModel.findByIdAndUpdate(id, input, { new: true }).exec();
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  async delete(id: string): Promise<ApplicationDocument> {
    const result = await this.applicationModel.findByIdAndDelete(id).exec();
    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
    return result;
  }
}
