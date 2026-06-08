import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from '../../libs/dto/user/create-user.input';
import { UpdateUserInput } from '../../libs/dto/user/update-user.input';
import { User, UserDocument } from '../../schemas/User.model';
import { Message } from '../../libs';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string, withPassword = false): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (withPassword) query.select('+password');
    return query.exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async create(input: CreateUserInput): Promise<UserDocument> {
    try {
      return await this.userModel.create({
        ...input,
        email: input.email.toLowerCase(),
      });
    } catch (err: any) {
      console.log('Error, UserService.create:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  async updateMe(userId: string, input: UpdateUserInput): Promise<UserDocument> {
    const result = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: input },
        { new: true },
      )
      .exec();
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash }).exec();
  }

  async removeRefreshTokenHash(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: '' } }).exec();
  }

  async findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+refreshTokenHash').exec();
  }

  async updateLastLoginAt(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { lastLoginAt: new Date() }).exec();
  }
}
