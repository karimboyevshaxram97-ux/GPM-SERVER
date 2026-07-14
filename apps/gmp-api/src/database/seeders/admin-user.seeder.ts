import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../schemas/User.model';
import { UserRole, UserStatus } from '../../libs/enums';

@Injectable()
export class AdminUserSeeder {
  private readonly logger = new Logger(AdminUserSeeder.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async seed(): Promise<void> {
    const email =
      this.configService.get<string>('ADMIN_EMAIL') || 'admin@gmp.com';
    const phone = this.configService.get<string>('ADMIN_PHONE');
    const password =
      this.configService.get<string>('ADMIN_PASSWORD') || 'Admin@123456';
    const firstName =
      this.configService.get<string>('ADMIN_FIRST_NAME') || 'Super';
    const lastName =
      this.configService.get<string>('ADMIN_LAST_NAME') || 'Admin';

    const lookup = phone
      ? { $or: [{ email }, { phoneNumber: phone }] }
      : { email };
    const existing = await this.userModel.findOne(lookup).exec();
    const passwordHash = await bcrypt.hash(password, 12);
    const adminData = {
      firstName,
      lastName,
      email,
      ...(phone ? { phoneNumber: phone } : {}),
      password: passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    };

    if (existing) {
      await this.userModel.updateOne(
        { _id: existing._id },
        {
          $set: adminData,
        },
      );
      this.logger.log(
        `Admin user already exists (${email}). Password and role refreshed.`,
      );
      return;
    }

    await this.userModel.create(adminData);

    this.logger.log(`Admin user created: ${email}`);
    if (!this.configService.get<string>('ADMIN_PASSWORD')) {
      this.logger.warn(
        `Default password is set. Change it immediately via ADMIN_PASSWORD env var.`,
      );
    }
  }
}
