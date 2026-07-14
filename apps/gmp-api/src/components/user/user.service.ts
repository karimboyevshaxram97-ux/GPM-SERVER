import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from '../../libs/dto/user/create-user.input';
import { UpdateUserInput } from '../../libs/dto/user/update-user.input';
import { User, UserDocument } from '../../schemas/User.model';
import { AuthProvider, Message, SocialProfile, UserRole } from '../../libs';

interface InternalCreateUserInput {
  phoneNumber: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(
    email: string,
    withPassword = false,
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (withPassword) query.select('+password');
    return query.exec();
  }

  async findByPhone(
    phoneNumber: string,
    withPassword = false,
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ phoneNumber });
    if (withPassword) query.select('+password');
    return query.exec();
  }

  async findByName(
    name: string,
    withPassword = false,
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ firstName: name });
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

  async updateMe(
    userId: string,
    input: UpdateUserInput,
  ): Promise<UserDocument> {
    try {
      const result = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $set: input },
          { new: true, runValidators: true },
        )
        .exec();
      if (!result)
        throw new InternalServerErrorException(Message.UPDATE_FAILED);
      return result;
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new BadRequestException(Message.ALREADY_EXISTS);
      }
      throw err;
    }
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash }).exec();
  }

  async removeRefreshTokenHash(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { $unset: { refreshTokenHash: '' } })
      .exec();
  }

  async findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+refreshTokenHash').exec();
  }

  async updateLastLoginAt(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { lastLoginAt: new Date() })
      .exec();
  }

  async updateRole(userId: string, role: UserRole): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { role }).exec();
  }

  async updateSuperAdminCredentials(
    userId: string,
    input: Partial<InternalCreateUserInput> & { password: string },
  ): Promise<void> {
    const update: any = {
      password: input.password,
      role: UserRole.SUPER_ADMIN,
    };
    if (input.phoneNumber) update.phoneNumber = input.phoneNumber;
    if (input.email) update.email = input.email.toLowerCase();
    if (input.firstName) update.firstName = input.firstName;
    if (input.lastName) update.lastName = input.lastName;

    await this.userModel.findByIdAndUpdate(userId, { $set: update }).exec();
  }

  async createInternal(data: InternalCreateUserInput): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async findByProvider(
    provider: AuthProvider,
    providerId: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ authProvider: provider, providerId })
      .exec();
  }

  async createSocialUser(profile: SocialProfile): Promise<UserDocument> {
    try {
      return await this.userModel.create({
        firstName: profile.firstName || profile.name || 'User',
        lastName: profile.lastName,
        email: profile.email ? profile.email.toLowerCase() : undefined,
        avatar: profile.avatarUrl,
        authProvider: profile.provider,
        providerId: profile.providerId,
        // Providers only return emails they have verified; without one it stays unverified
        emailVerified: Boolean(profile.email),
      });
    } catch (err: any) {
      console.log('Error, UserService.createSocialUser:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  // Fill in profile fields the provider withheld on an earlier login (e.g. the
  // consent item was enabled in the provider console after the account was made)
  async refreshSocialProfile(
    user: UserDocument,
    profile: SocialProfile,
  ): Promise<UserDocument> {
    let changed = false;
    if (!user.avatar && profile.avatarUrl) {
      user.avatar = profile.avatarUrl;
      changed = true;
    }
    if (!user.email && profile.email) {
      user.email = profile.email.toLowerCase();
      user.emailVerified = true;
      changed = true;
    }
    return changed ? user.save() : user;
  }

  async linkSocialAccount(
    userId: string,
    profile: SocialProfile,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new BadRequestException(Message.USER_NOT_FOUND);

    user.authProvider = profile.provider;
    user.providerId = profile.providerId;
    if (!user.avatar && profile.avatarUrl) user.avatar = profile.avatarUrl;
    // The provider confirmed ownership of this email during OAuth consent
    if (profile.email && user.email === profile.email.toLowerCase())
      user.emailVerified = true;
    return user.save();
  }
}
