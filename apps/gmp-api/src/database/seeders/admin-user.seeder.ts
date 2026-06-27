import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../schemas/User.model';
import { UserRole, UserStatus } from '../../libs/enums';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmp.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

@Injectable()
export class AdminUserSeeder {
  private readonly logger = new Logger(AdminUserSeeder.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async seed(): Promise<void> {
    const existing = await this.userModel.findOne({ email: ADMIN_EMAIL }).exec();
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    if (existing) {
      await this.userModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            password: passwordHash,
            role: UserRole.SUPER_ADMIN,
            status: UserStatus.ACTIVE,
            emailVerified: true,
          },
        },
      );
      this.logger.log(`Admin user already exists (${ADMIN_EMAIL}). Password and role refreshed.`);
      return;
    }

    await this.userModel.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: ADMIN_EMAIL,
      password: passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });

    this.logger.log(`Admin user created: ${ADMIN_EMAIL}`);
    this.logger.warn(`Default password is set. Change it immediately via ADMIN_PASSWORD env var.`);
  }
}
