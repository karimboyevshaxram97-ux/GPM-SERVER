import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { BadRequestException, ForbiddenException, UseGuards, InternalServerErrorException } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ServiceService } from '../service/service.service';
import { AgencyService } from '../agency/agency.service';
import { NotificationService } from '../notification/notification.service';
import { ApplicationType } from '../../libs/dto/application/application.type';
import { CreateApplicationInput, UpdateApplicationInput } from '../../libs/dto/application/application.input';
import { GqlRolesGuard } from '../auth/guards/gql-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AgencyStatus, AgencyVerificationStatus, ApplicationStatus, NotificationType, ServiceStatus, ServiceVisibility, UserRole, Message } from '../../libs/enums';

@Resolver(() => ApplicationType)
export class ApplicationResolver {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly serviceService: ServiceService,
    private readonly agencyService: AgencyService,
    private readonly notificationService: NotificationService,
  ) {}

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Query(() => [ApplicationType], { name: 'applications' })
  async applications(): Promise<ApplicationType[]> {
    console.log('Query: applications');
    return this.applicationService.findAll() as any;
  }

  @Query(() => [ApplicationType], { name: 'myApplications' })
  async myApplications(@CurrentUser() user: any): Promise<ApplicationType[]> {
    console.log('Query: myApplications');
    return this.applicationService.findByUser(user._id.toString()) as any;
  }

  @Query(() => [ApplicationType], { name: 'applicationsByAgency' })
  async applicationsByAgency(
    @Args('agencyId') agencyId: string,
    @CurrentUser() user: any,
  ): Promise<ApplicationType[]> {
    console.log('Query: applicationsByAgency');
    await this.agencyService.assertAgencyAdmin(agencyId, user);
    return this.applicationService.findByAgency(agencyId) as any;
  }

  @Query(() => [ApplicationType], { name: 'applicationsByService' })
  async applicationsByService(
    @Args('serviceId') serviceId: string,
    @CurrentUser() user: any,
  ): Promise<ApplicationType[]> {
    console.log('Query: applicationsByService');
    const service = await this.serviceService.findById(serviceId);
    if (!service) throw new InternalServerErrorException(Message.SERVICE_NOT_FOUND);
    await this.agencyService.assertAgencyAdmin(service.agency.toString(), user);
    return this.applicationService.findByService(serviceId) as any;
  }

  @Mutation(() => ApplicationType, { name: 'createApplication' })
  async createApplication(
    @Args('input') input: CreateApplicationInput,
    @CurrentUser() user: any,
  ): Promise<ApplicationType> {
    console.log('Mutation: createApplication');
    const service = await this.serviceService.findById(input.serviceId);
    if (!service) throw new InternalServerErrorException(Message.SERVICE_NOT_FOUND);
    if (service.status !== ServiceStatus.ACTIVE || service.visibility !== ServiceVisibility.PUBLIC) {
      throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
    }

    const agency = await this.agencyService.findById(service.agency.toString());
    if (!agency) throw new InternalServerErrorException(Message.AGENCY_NOT_FOUND);
    if (agency.status !== AgencyStatus.ACTIVE || agency.verificationStatus !== AgencyVerificationStatus.VERIFIED) {
      throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
    }

    if (
      service.maxApplicationCount !== undefined &&
      service.currentApplicationCount >= service.maxApplicationCount
    ) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }

    const alreadyApplied = await this.applicationService.existsForUserAndService(
      user._id.toString(),
      service._id.toString(),
    );
    if (alreadyApplied) throw new BadRequestException(Message.ALREADY_EXISTS);

    const application = await this.applicationService.create(
      input,
      user._id.toString(),
      service._id.toString(),
      service.agency.toString(),
    );

    await this.serviceService.serviceStatsEditor({
      _id: service._id,
      targetKey: 'currentApplicationCount',
      modifier: 1,
    });

    if (agency?.owner) {
      await this.notificationService.notify({
        recipient: agency.owner.toString(),
        sender: user._id.toString(),
        type: NotificationType.APPLICATION_RECEIVED,
        message: `New application received for "${service.name}"`,
        targetId: application._id.toString(),
        targetType: 'Application',
      });
    }

    return application as any;
  }

  @Mutation(() => ApplicationType, { name: 'updateApplicationStatus' })
  async updateApplicationStatus(
    @Args('id') id: string,
    @Args('input') input: UpdateApplicationInput,
    @CurrentUser() user: any,
  ): Promise<ApplicationType> {
    console.log('Mutation: updateApplicationStatus');
    const existing = await this.applicationService.findById(id);
    if (!existing) throw new InternalServerErrorException(Message.APPLICATION_NOT_FOUND);
    const canManage = await this.agencyService
      .assertAgencyAdmin(existing.agency.toString(), user)
      .then(() => true)
      .catch(() => false);

    if (!canManage) {
      const isOwnerWithdraw =
        existing.user.toString() === user._id.toString() &&
        input.status === ApplicationStatus.WITHDRAWN &&
        Object.keys(input).every((key) => ['status', 'notes', 'documents'].includes(key));

      if (!isOwnerWithdraw) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
    }

    const updated = await this.applicationService.update(id, input);

    if (input.status && input.status !== existing.status) {
      await this.notificationService.notify({
        recipient: existing.user.toString(),
        type: NotificationType.APPLICATION_STATUS_CHANGED,
        message: `Your application status has been updated to "${input.status}"`,
        targetId: id,
        targetType: 'Application',
      });
    }

    return updated as any;
  }
}
