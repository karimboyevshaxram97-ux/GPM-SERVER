import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { AgencyService } from '../agency/agency.service';
import { ServiceGraphType } from '../../libs/dto/service/service.type';
import { ServicesInquiryInput } from '../../libs/dto/service/services-inquiry.input';
import { ServicesInquiryResult } from '../../libs/dto/service/services-inquiry.result';
import {
  CreateServiceInput,
  UpdateServiceInput,
} from '../../libs/dto/service/service.input';
import { WithoutAuth } from '../auth/guards/without.guard';
import {
  AgencyStatus,
  AgencyVerificationStatus,
  UserRole,
  Message,
  NotificationType,
} from '../../libs/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FollowService } from '../follow/follow.service';
import { NotificationService } from '../notification/notification.service';

@Resolver(() => ServiceGraphType)
export class ServiceResolver {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly agencyService: AgencyService,
    private readonly followService: FollowService,
    private readonly notificationService: NotificationService,
  ) {}

  @WithoutAuth()
  @Query(() => ServicesInquiryResult, { name: 'getServices' })
  async getServices(
    @Args('input') input: ServicesInquiryInput,
    @CurrentUser() user: any,
  ): Promise<ServicesInquiryResult> {
    console.log('Query: getServices');
    const canViewRestricted =
      user?.role === UserRole.SUPER_ADMIN ||
      (!!input.agencyId &&
        this.agencyService.isAgencyAdmin(
          await this.agencyService.findById(input.agencyId),
          user,
        ));

    return this.serviceService.getServices(
      input,
      user?._id?.toString(),
      canViewRestricted,
    );
  }

  @WithoutAuth()
  @Query(() => ServiceGraphType, { name: 'getService', nullable: true })
  async getService(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ): Promise<ServiceGraphType | null> {
    console.log('Query: getService');
    const service = await this.serviceService.findById(id);
    if (!service)
      throw new InternalServerErrorException(Message.SERVICE_NOT_FOUND);
    const agency = await this.agencyService.findById(service.agency.toString());
    const canViewRestricted = this.agencyService.isAgencyAdmin(agency, user);
    if (
      !canViewRestricted &&
      (agency?.status !== AgencyStatus.ACTIVE ||
        agency?.verificationStatus !== AgencyVerificationStatus.VERIFIED)
    ) {
      throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
    }
    return this.serviceService.getServiceDetail(
      id,
      user?._id?.toString(),
      canViewRestricted,
    ) as any;
  }

  @WithoutAuth()
  @Query(() => [ServiceGraphType], { name: 'getServicesByAgency' })
  async getServicesByAgency(
    @Args('agencyId') agencyId: string,
    @CurrentUser() user: any,
  ): Promise<ServiceGraphType[]> {
    console.log('Query: getServicesByAgency');
    const agency = await this.agencyService.findById(agencyId);
    if (
      !agency ||
      agency.status !== AgencyStatus.ACTIVE ||
      agency.verificationStatus !== AgencyVerificationStatus.VERIFIED
    ) {
      return [];
    }
    return this.serviceService.findPublicByAgency(
      agencyId,
      user?._id?.toString(),
    ) as any;
  }

  @Mutation(() => ServiceGraphType, { name: 'createService' })
  async createService(
    @Args('agencyId') agencyId: string,
    @Args('input') input: CreateServiceInput,
    @CurrentUser() user: any,
  ): Promise<ServiceGraphType> {
    console.log('Mutation: createService');
    const agency = await this.agencyService.assertAgencyAdmin(agencyId, user);
    if (
      agency.verificationStatus !== AgencyVerificationStatus.VERIFIED ||
      agency.status !== AgencyStatus.ACTIVE
    ) {
      throw new ForbiddenException(Message.AGENCY_NOT_VERIFIED);
    }

    const service = await this.serviceService.create(input, agencyId);
    await this.agencyService.agencyStatsEditor({
      _id: agency._id,
      targetKey: 'totalServices',
      modifier: 1,
    });

    const serviceName = service.name?.en || service.name?.uz || '';
    const followers = await this.followService.getAgencyFollowers(agencyId);
    for (const follow of followers) {
      if (!follow.notificationsEnabled) continue;
      await this.notificationService.notify({
        recipient: follow.user.toString(),
        type: NotificationType.NEW_SERVICE,
        message: `New service "${serviceName}" was added by an agency you follow`,
        targetId: service._id.toString(),
        targetType: 'Service',
      });
    }

    return service as any;
  }

  @Mutation(() => ServiceGraphType, { name: 'updateService' })
  async updateService(
    @Args('id') id: string,
    @Args('input') input: UpdateServiceInput,
    @CurrentUser() user: any,
  ): Promise<ServiceGraphType> {
    console.log('Mutation: updateService');
    const service = await this.serviceService.findById(id);
    if (!service)
      throw new InternalServerErrorException(Message.SERVICE_NOT_FOUND);
    await this.agencyService.assertAgencyAdmin(service.agency.toString(), user);
    return this.serviceService.update(id, input) as any;
  }

  @Mutation(() => Boolean, { name: 'deleteService' })
  async deleteService(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    console.log('Mutation: deleteService');
    const service = await this.serviceService.findById(id);
    if (!service)
      throw new InternalServerErrorException(Message.SERVICE_NOT_FOUND);
    await this.agencyService.assertAgencyAdmin(service.agency.toString(), user);
    await this.serviceService.delete(id);
    await this.agencyService.agencyStatsEditor({
      _id: service.agency,
      targetKey: 'totalServices',
      modifier: -1,
    });
    return true;
  }
}
