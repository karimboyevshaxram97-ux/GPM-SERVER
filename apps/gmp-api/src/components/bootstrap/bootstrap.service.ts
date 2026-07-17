import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { UserRole } from '../../libs/enums';
import { CountriesSeeder } from '../../database/seeders/countries.seeder';
import { SubscriptionPlansSeeder } from '../../database/seeders/subscription-plans.seeder';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly countriesSeeder: CountriesSeeder,
    private readonly subscriptionPlansSeeder: SubscriptionPlansSeeder,
  ) {}

  async onModuleInit() {
    await this.seedReferenceData();
    await this.seedSuperAdmin();
  }

  private async seedReferenceData() {
    const enabled = !/^(0|false|no)$/i.test(
      this.configService.get<string>('SEED_REFERENCE_DATA_ON_BOOT') ?? 'true',
    );
    if (!enabled) {
      this.logger.log('Reference data seed disabled.');
      return;
    }

    await this.countriesSeeder.seed();
    await this.subscriptionPlansSeeder.seed();
  }

  private async seedSuperAdmin() {
    const phone = this.configService.get<string>('ADMIN_PHONE');
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    const email =
      this.configService.get<string>('ADMIN_EMAIL') ??
      (phone ? `${phone.replace(/\D/g, '')}@gmp.app` : undefined);

    if ((!phone && !email) || !password) {
      this.logger.warn(
        'ADMIN_PHONE or ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed',
      );
      return;
    }

    const firstName =
      this.configService.get<string>('ADMIN_FIRST_NAME') ?? 'Super';
    const lastName =
      this.configService.get<string>('ADMIN_LAST_NAME') ?? 'Admin';
    const passwordHash = await bcrypt.hash(password, 10);

    const existsByPhone = phone
      ? await this.userService.findByPhone(phone)
      : null;
    const existsByEmail = email
      ? await this.userService.findByEmail(email)
      : null;
    const exists = existsByPhone ?? existsByEmail;

    if (exists) {
      await this.userService.updateSuperAdminCredentials(
        exists._id.toString(),
        {
          phoneNumber: phone,
          password: passwordHash,
          firstName,
          lastName,
          email,
          role: UserRole.SUPER_ADMIN,
        },
      );
      this.logger.log(
        `Super admin refreshed — email: ${email ?? 'n/a'}, phone: ${phone ?? 'n/a'}`,
      );
      return;
    }

    await this.userService.createInternal({
      phoneNumber: phone,
      password: passwordHash,
      firstName,
      lastName,
      email: email!,
      role: UserRole.SUPER_ADMIN,
    });

    this.logger.log(
      `Super admin seeded — email: ${email}, phone: ${phone ?? 'n/a'}`,
    );
  }
}
