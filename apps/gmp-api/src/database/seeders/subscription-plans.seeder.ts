import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SubscriptionPlan,
  SubscriptionPlanDocument,
} from '../../schemas/SubscriptionPlan.model';
import { PlanStatus, SupportLevel } from '../../libs/enums';

const PLANS = [
  {
    name: 'Basic',
    slug: 'basic',
    description:
      'Perfect for small agencies just getting started on the platform.',
    monthlyPrice: 29,
    annualPrice: 290,
    currency: 'USD',
    maxServices: 5,
    maxTeamMembers: 2,
    maxApplicationsPerMonth: 50,
    supportLevel: SupportLevel.BASIC,
    isPublic: true,
    displayOrder: 1,
    status: PlanStatus.ACTIVE,
    features: [
      { name: 'Service listings', included: true, limit: 5 },
      { name: 'Application management', included: true, limit: 50 },
      { name: 'Team members', included: true, limit: 2 },
      { name: 'Analytics dashboard', included: true },
      { name: 'Email support', included: true },
      { name: 'Priority support', included: false },
      { name: 'API access', included: false },
      { name: 'Custom branding', included: false },
    ],
  },
  {
    name: 'Standard',
    slug: 'standard',
    description: 'For growing agencies that need more capacity and features.',
    monthlyPrice: 79,
    annualPrice: 790,
    currency: 'USD',
    maxServices: 25,
    maxTeamMembers: 10,
    maxApplicationsPerMonth: 300,
    supportLevel: SupportLevel.STANDARD,
    isPublic: true,
    displayOrder: 2,
    status: PlanStatus.ACTIVE,
    features: [
      { name: 'Service listings', included: true, limit: 25 },
      { name: 'Application management', included: true, limit: 300 },
      { name: 'Team members', included: true, limit: 10 },
      { name: 'Analytics dashboard', included: true },
      { name: 'Email support', included: true },
      { name: 'Priority support', included: true },
      { name: 'API access', included: true },
      { name: 'Custom branding', included: false },
    ],
  },
  {
    name: 'Premium',
    slug: 'premium',
    description: 'Unlimited capacity for large agencies and enterprises.',
    monthlyPrice: 199,
    annualPrice: 1990,
    currency: 'USD',
    maxServices: 999,
    maxTeamMembers: 999,
    maxApplicationsPerMonth: 9999,
    supportLevel: SupportLevel.PREMIUM,
    isPublic: true,
    displayOrder: 3,
    status: PlanStatus.ACTIVE,
    features: [
      { name: 'Service listings', included: true },
      { name: 'Application management', included: true },
      { name: 'Team members', included: true },
      { name: 'Analytics dashboard', included: true },
      { name: 'Email support', included: true },
      { name: 'Priority support', included: true },
      { name: 'API access', included: true },
      { name: 'Custom branding', included: true },
    ],
  },
];

@Injectable()
export class SubscriptionPlansSeeder {
  private readonly logger = new Logger(SubscriptionPlansSeeder.name);

  constructor(
    @InjectModel(SubscriptionPlan.name)
    private planModel: Model<SubscriptionPlanDocument>,
  ) {}

  async seed(): Promise<void> {
    const existing = await this.planModel.countDocuments().exec();
    if (existing > 0) {
      this.logger.log(
        `Subscription plans already seeded (${existing} records). Skipping.`,
      );
      return;
    }

    await this.planModel.insertMany(PLANS);
    this.logger.log(`Seeded ${PLANS.length} subscription plans.`);
  }
}
