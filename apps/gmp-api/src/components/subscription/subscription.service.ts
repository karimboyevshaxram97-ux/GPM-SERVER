import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SubscriptionPlan,
  SubscriptionPlanDocument,
} from '../../schemas/SubscriptionPlan.model';
import {
  AgencySubscription,
  AgencySubscriptionDocument,
} from '../../schemas/AgencySubscription.model';
import { Agency, AgencyDocument } from '../../schemas/Agency.model';
import {
  CreateSubscriptionPlanInput,
  SubscribeToPlanInput,
} from '../../libs/dto/subscription/subscription.input';
import { SubscriptionStatus, BillingCycle, PlanStatus } from '../../libs/enums';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(SubscriptionPlan.name)
    private planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(AgencySubscription.name)
    private subscriptionModel: Model<AgencySubscriptionDocument>,
    @InjectModel(Agency.name)
    private agencyModel: Model<AgencyDocument>,
  ) {}

  // ─── Plans ───────────────────────────────────────────────────────────────────

  async getPublicPlans(): Promise<SubscriptionPlanDocument[]> {
    return this.planModel
      .find({ isPublic: true, status: PlanStatus.ACTIVE })
      .sort({ displayOrder: 1 })
      .exec();
  }

  async getAllPlans(): Promise<SubscriptionPlanDocument[]> {
    return this.planModel.find().sort({ displayOrder: 1 }).exec();
  }

  async getPlanById(id: string): Promise<SubscriptionPlanDocument | null> {
    return this.planModel.findById(id).exec();
  }

  async createPlan(
    input: CreateSubscriptionPlanInput,
  ): Promise<SubscriptionPlanDocument> {
    const slug = input.name.toLowerCase().replace(/\s+/g, '-');
    const plan = new this.planModel({ ...input, slug });
    return plan.save();
  }

  async archivePlan(id: string): Promise<SubscriptionPlanDocument> {
    const plan = await this.planModel.findById(id).exec();
    if (!plan) throw new NotFoundException('Plan not found');
    plan.status = PlanStatus.ARCHIVED;
    return plan.save();
  }

  // ─── Subscriptions ───────────────────────────────────────────────────────────

  async subscribeToPlan(
    input: SubscribeToPlanInput,
  ): Promise<AgencySubscriptionDocument> {
    const plan = await this.planModel.findById(input.planId).exec();
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.status !== PlanStatus.ACTIVE)
      throw new BadRequestException('Plan is not active');

    // Cancel any existing active subscription
    await this.subscriptionModel
      .updateMany(
        {
          agency: new Types.ObjectId(input.agencyId),
          status: SubscriptionStatus.ACTIVE,
        },
        { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
      )
      .exec();

    const startDate = new Date();
    const endDate = new Date(startDate);
    if (input.billingCycle === BillingCycle.MONTHLY) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const renewalDate = new Date(endDate);

    const subscription = new this.subscriptionModel({
      agency: new Types.ObjectId(input.agencyId),
      plan: new Types.ObjectId(input.planId),
      billingCycle: input.billingCycle,
      autoRenew: input.autoRenew ?? true,
      startDate,
      endDate,
      renewalDate,
    });
    const saved = await subscription.save();

    await this.agencyModel
      .findByIdAndUpdate(input.agencyId, {
        activeSubscription: saved._id,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      })
      .exec();

    return saved;
  }

  async getAgencySubscriptions(
    agencyId: string,
  ): Promise<AgencySubscriptionDocument[]> {
    return this.subscriptionModel
      .find({ agency: new Types.ObjectId(agencyId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getActiveSubscription(
    agencyId: string,
  ): Promise<AgencySubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({
        agency: new Types.ObjectId(agencyId),
        status: SubscriptionStatus.ACTIVE,
      })
      .exec();
  }

  async cancelSubscription(
    subscriptionId: string,
  ): Promise<AgencySubscriptionDocument> {
    const sub = await this.subscriptionModel.findById(subscriptionId).exec();
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status !== SubscriptionStatus.ACTIVE)
      throw new BadRequestException('Subscription is not active');

    sub.status = SubscriptionStatus.CANCELLED;
    sub.cancelledAt = new Date();
    sub.autoRenew = false;
    const saved = await sub.save();

    await this.agencyModel
      .findByIdAndUpdate(sub.agency, {
        subscriptionStatus: SubscriptionStatus.CANCELLED,
      })
      .exec();

    return saved;
  }

  // apps/gmp-batch'dagi kunlik cron shu metodni chaqiradi (subscribeToPlan/cancelSubscription
  // yozgan Agency.subscriptionStatus'ni endDate o'tib ketgan obunalar uchun ham sinxronlaydi).
  async expireOverdueSubscriptions(): Promise<number> {
    const now = new Date();
    const overdue = await this.subscriptionModel
      .find({ status: SubscriptionStatus.ACTIVE, endDate: { $lt: now } })
      .select('_id agency')
      .exec();
    if (!overdue.length) return 0;

    const subscriptionIds = overdue.map((sub) => sub._id);
    const agencyIds = overdue.map((sub) => sub.agency);

    await this.subscriptionModel
      .updateMany(
        { _id: { $in: subscriptionIds } },
        { status: SubscriptionStatus.EXPIRED },
      )
      .exec();

    await this.agencyModel
      .updateMany(
        { _id: { $in: agencyIds } },
        { subscriptionStatus: SubscriptionStatus.EXPIRED },
      )
      .exec();

    return subscriptionIds.length;
  }
}
