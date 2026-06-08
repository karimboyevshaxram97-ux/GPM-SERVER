import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ServiceService } from '../service/service.service';
import { AgencyService } from '../agency/agency.service';
import { NotificationService } from '../notification/notification.service';
import { ApplicationType } from '../../libs/dto/application/application.type';
import { CreateApplicationInput, UpdateApplicationInput } from '../../libs/dto/application/application.input';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationType } from '../../libs/enums';

@Resolver(() => ApplicationType)
export class ApplicationResolver {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly serviceService: ServiceService,
    private readonly agencyService: AgencyService,
    private readonly notificationService: NotificationService,
  ) {}

  @Query(() => [ApplicationType], { name: 'applications' })
  async applications(): Promise<ApplicationType[]> {
    return this.applicationService.findAll() as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [ApplicationType], { name: 'myApplications' })
  async myApplications(@CurrentUser() user: any): Promise<ApplicationType[]> {
    return this.applicationService.findByUser(user._id.toString()) as any;
  }

  @Query(() => [ApplicationType], { name: 'applicationsByAgency' })
  async applicationsByAgency(@Args('agencyId') agencyId: string): Promise<ApplicationType[]> {
    return this.applicationService.findByAgency(agencyId) as any;
  }

  @Query(() => [ApplicationType], { name: 'applicationsByService' })
  async applicationsByService(@Args('serviceId') serviceId: string): Promise<ApplicationType[]> {
    return this.applicationService.findByService(serviceId) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ApplicationType, { name: 'createApplication' })
  async createApplication(
    @Args('input') input: CreateApplicationInput,
    @CurrentUser() user: any,
  ): Promise<ApplicationType> {
    const service = await this.serviceService.findById(input.serviceId);
    if (!service) throw new NotFoundException('Service not found');

    const application = await this.applicationService.create(
      input,
      user._id.toString(),
      service._id.toString(),
      service.agency.toString(),
    );

    await this.serviceService.incrementField(service._id, 'currentApplicationCount');

    const agency = await this.agencyService.findById(service.agency.toString());
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

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ApplicationType, { name: 'updateApplicationStatus' })
  async updateApplicationStatus(
    @Args('id') id: string,
    @Args('input') input: UpdateApplicationInput,
  ): Promise<ApplicationType> {
    const existing = await this.applicationService.findById(id);
    if (!existing) throw new NotFoundException('Application not found');

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
