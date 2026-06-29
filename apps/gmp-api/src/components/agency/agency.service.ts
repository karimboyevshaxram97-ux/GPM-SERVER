import { Injectable, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Agency, AgencyDocument } from '../../schemas/Agency.model';
import { CreateAgencyInput, UpdateAgencyInput } from '../../libs/dto/agency/agency.input';
import { AgenciesInquiryInput } from '../../libs/dto/agency/agencies-inquiry.input';
import { AgenciesForMapInput } from '../../libs/dto/agency/agencies-for-map.input';
import { AgenciesInquiryResult } from '../../libs/dto/agency/agencies-inquiry.result';
import {
  AgencyStatus,
  AgencyVerificationStatus,
  Direction,
  LikeTargetType,
  ServiceStatus,
  ServiceVisibility,
  UserRole,
  ViewTargetType,
} from '../../libs/enums';
import { Message, T, StatisticModifier } from '../../libs';
import { lookupAuthUserLiked, lookupAuthUserFollowed } from '../../libs/config/aggregation';
import { ViewService } from '../view/view.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AgencyService {
  constructor(
    @InjectModel(Agency.name) private readonly agencyModel: Model<AgencyDocument>,
    private readonly viewService: ViewService,
    private readonly userService: UserService,
  ) {}

  private normalizeAgency(agency: any): any {
    if (!agency) return agency;

    const item = agency?.toObject ? agency.toObject() : { ...agency };
    const rawName = item.name;
    const fallback =
      item.businessName ||
      item.companyName ||
      item.legalName ||
      item.email ||
      item.slug ||
      `Agency ${item._id?.toString?.() ?? ''}`.trim();

    const name =
      typeof rawName === 'string'
        ? { uz: rawName, ru: rawName, en: rawName, ko: rawName }
        : {
            uz: rawName?.uz || fallback,
            ru: rawName?.ru || rawName?.en || rawName?.uz || fallback,
            en: rawName?.en || rawName?.uz || rawName?.ru || fallback,
            ko: rawName?.ko || rawName?.en || rawName?.uz || fallback,
          };

    return {
      ...item,
      name,
      slug: item.slug || item._id?.toString?.() || '',
      email: item.email || '',
      operatingCountries: item.operatingCountries ?? [],
      admins: item.admins ?? [],
      status: item.status ?? AgencyStatus.ACTIVE,
      verificationStatus: item.verificationStatus ?? AgencyVerificationStatus.PENDING,
    };
  }

  async getAgencies(input: AgenciesInquiryInput, userId?: string): Promise<AgenciesInquiryResult> {
    const { text, country, serviceType, sort, direction, page, limit } = input;

    const match: T = {
      status: AgencyStatus.ACTIVE,
      verificationStatus: AgencyVerificationStatus.VERIFIED,
    };

    if (text) {
      match.$or = [
        { 'name.uz': { $regex: text, $options: 'i' } },
        { 'name.ru': { $regex: text, $options: 'i' } },
        { 'name.en': { $regex: text, $options: 'i' } },
        { 'name.ko': { $regex: text, $options: 'i' } },
        { 'description.uz': { $regex: text, $options: 'i' } },
        { email: { $regex: text, $options: 'i' } },
      ];
    }
    if (country) match.operatingCountries = country;

    const sortDir = direction === Direction.ASC ? 1 : -1;
    const skip = (page - 1) * limit;
    const userObjId = userId ? new Types.ObjectId(userId) : null;

    const pipeline: PipelineStage[] = [
      { $match: match },
    ];

    if (serviceType) {
      pipeline.push(
        {
          $lookup: {
            from: 'services',
            let: { agencyId: '$_id' },
            as: 'matchingServices',
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$agency', '$$agencyId'] },
                  serviceType,
                  status: ServiceStatus.ACTIVE,
                  visibility: ServiceVisibility.PUBLIC,
                },
              },
              { $limit: 1 },
            ],
          },
        },
        { $match: { 'matchingServices.0': { $exists: true } } },
      );
    }

    pipeline.push(
      { $sort: { [sort]: sortDir } },
      {
        $facet: {
          list: [
            { $skip: skip },
            { $limit: limit },
            lookupAuthUserLiked(userObjId, '$_id', LikeTargetType.AGENCY),
            lookupAuthUserFollowed(userObjId, '$_id'),
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    );

    const result = await this.agencyModel.aggregate<AgenciesInquiryResult>(pipeline);

    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return {
      ...result[0],
      list: (result[0].list ?? []).map((agency: any) => this.normalizeAgency(agency)),
    };
  }

  async getAgencyDetail(id: string, user?: any): Promise<AgencyDocument | null> {
    const userId = user?._id?.toString?.();
    const userObjId = userId ? new Types.ObjectId(userId) : null;

    const result = await this.agencyModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      lookupAuthUserLiked(userObjId, '$_id', LikeTargetType.AGENCY),
      lookupAuthUserFollowed(userObjId, '$_id'),
    ]);

    if (!result.length) throw new InternalServerErrorException(Message.AGENCY_NOT_FOUND);

    const agency = this.normalizeAgency(result[0]);
    const canViewRestricted = this.isAgencyAdmin(agency, user);
    if (
      !canViewRestricted &&
      (agency.status !== AgencyStatus.ACTIVE || agency.verificationStatus !== AgencyVerificationStatus.VERIFIED)
    ) {
      throw new InternalServerErrorException(Message.AGENCY_NOT_FOUND);
    }

    await this.viewService.recordView(id, ViewTargetType.AGENCY, userId);
    return agency;
  }

  async findById(id: string): Promise<AgencyDocument | null> {
    return this.agencyModel.findById(id).exec();
  }

  async findBySlug(slug: string): Promise<AgencyDocument | null> {
    const agency = await this.agencyModel.findOne({ slug }).exec();
    return this.normalizeAgency(agency);
  }

  async findPublicBySlug(slug: string): Promise<AgencyDocument | null> {
    const agency = await this.agencyModel
      .findOne({
        slug,
        status: AgencyStatus.ACTIVE,
        verificationStatus: AgencyVerificationStatus.VERIFIED,
      })
      .exec();
    return this.normalizeAgency(agency);
  }

  async findByOwner(userId: string): Promise<AgencyDocument | null> {
    const agency = await this.agencyModel.findOne({ owner: new Types.ObjectId(userId) }).exec();
    return this.normalizeAgency(agency);
  }

  isAgencyAdmin(agency: AgencyDocument | any, user: any): boolean {
    if (!agency || !user) return false;
    if (user.role === UserRole.SUPER_ADMIN) return true;

    const userId = user._id?.toString?.() ?? user.id?.toString?.();
    if (!userId) return false;

    const ownerId = agency.owner?.toString?.();
    if (ownerId === userId) return true;

    return (agency.admins ?? []).some((adminId: any) => adminId?.toString?.() === userId);
  }

  async assertAgencyAdmin(agencyId: string, user: any): Promise<AgencyDocument> {
    const agency = await this.findById(agencyId);
    if (!agency) throw new BadRequestException(Message.AGENCY_NOT_FOUND);
    if (!this.isAgencyAdmin(agency, user)) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
    return agency;
  }

  async create(input: CreateAgencyInput, userId: string): Promise<AgencyDocument> {
    const existing = await this.findByOwner(userId);
    if (existing) throw new BadRequestException(Message.ALREADY_EXISTS);

    try {
      const primaryName = input.name.en || input.name.uz;
      const slug = primaryName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const agency = await this.agencyModel.create({
        ...input,
        slug,
        owner: new Types.ObjectId(userId),
        admins: [new Types.ObjectId(userId)],
      });

      // Promote the owner to AGENCY_ADMIN, but never demote a SUPER_ADMIN.
      const owner = await this.userService.findById(userId);
      if (owner && owner.role !== UserRole.SUPER_ADMIN) {
        await this.userService.updateRole(userId, UserRole.AGENCY_ADMIN);
      }
      return agency;
    } catch (err: any) {
      console.log('Error, AgencyService.create:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  async update(id: string, input: UpdateAgencyInput): Promise<AgencyDocument> {
    const result = await this.agencyModel.findByIdAndUpdate(id, input, { new: true }).exec();
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  async updateByOwner(userId: string, input: UpdateAgencyInput): Promise<AgencyDocument> {
    const agency = await this.agencyModel.findOne({ owner: new Types.ObjectId(userId) }).exec();
    if (!agency) throw new BadRequestException(Message.AGENCY_NOT_FOUND);
    const result = await this.agencyModel.findByIdAndUpdate(agency._id, input, { new: true }).exec();
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  async delete(id: string): Promise<AgencyDocument> {
    const result = await this.agencyModel.findByIdAndDelete(id).exec();
    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
    return result;
  }

  async getAgenciesForMap(filter: AgenciesForMapInput): Promise<AgencyDocument[]> {
    const match: T = {
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
      status: AgencyStatus.ACTIVE,
      verificationStatus: AgencyVerificationStatus.VERIFIED,
    };

    if (filter.country) match.country = { $regex: filter.country, $options: 'i' };
    if (filter.city) match.city = { $regex: filter.city, $options: 'i' };
    if (filter.text) {
      match.$or = [
        { 'name.uz': { $regex: filter.text, $options: 'i' } },
        { 'name.ru': { $regex: filter.text, $options: 'i' } },
        { 'name.en': { $regex: filter.text, $options: 'i' } },
        { 'name.ko': { $regex: filter.text, $options: 'i' } },
        { city: { $regex: filter.text, $options: 'i' } },
        { address: { $regex: filter.text, $options: 'i' } },
      ];
    }

    const agencies = await this.agencyModel
      .find(match)
      .select('_id name slug logo address city country latitude longitude phoneNumber email averageRating totalReviews totalServices verificationStatus')
      .lean()
      .exec();

    return agencies.map((agency) => this.normalizeAgency(agency)) as unknown as AgencyDocument[];
  }

  async agencyStatsEditor(input: StatisticModifier): Promise<AgencyDocument | null> {
    const { _id, targetKey, modifier } = input;
    return this.agencyModel
      .findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true })
      .exec();
  }

  async updateReviewStats(id: string, averageRating: number, totalReviews: number): Promise<void> {
    await this.agencyModel.findByIdAndUpdate(id, { averageRating, totalReviews }).exec();
  }
}
