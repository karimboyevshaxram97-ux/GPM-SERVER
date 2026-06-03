import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ServiceService } from '../service/service.service';
import { ApplicationType } from './dto/application.type';
import { CreateApplicationInput, UpdateApplicationInput } from './dto/application.input';
import { GqlJwtAuthGuard } from '../../common/guards/gql-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => ApplicationType)
export class ApplicationResolver {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly serviceService: ServiceService,
  ) {}

  @Query(() => [ApplicationType], { name: 'applications' })
  async applications(): Promise<ApplicationType[]> {
    return this.applicationService.findAll() as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [ApplicationType], { name: 'applicationsByUser' })
  async applicationsByUser(@CurrentUser() user: any): Promise<ApplicationType[]> {
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
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.applicationService.create(
      input,
      user._id.toString(),
      service._id.toString(),
      service.agency.toString(),
    ) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ApplicationType, { name: 'updateApplication' })
  async updateApplication(
    @Args('id') id: string,
    @Args('input') input: UpdateApplicationInput,
  ): Promise<ApplicationType> {
    return this.applicationService.update(id, input) as any;
  }
}
