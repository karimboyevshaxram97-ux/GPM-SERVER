import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ServiceService } from './service.service';
import { AgencyService } from '../agency/agency.service';
import { ServiceGraphType } from '../../libs/dto/service/service.type';
import { ServicesInquiryInput } from '../../libs/dto/service/services-inquiry.input';
import { ServicesInquiryResult } from '../../libs/dto/service/services-inquiry.result';
import { CreateServiceInput, UpdateServiceInput } from '../../libs/dto/service/service.input';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../libs/enums/user.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => ServiceGraphType)
export class ServiceResolver {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly agencyService: AgencyService,
  ) {}

  @Public()
  @Query(() => ServicesInquiryResult, { name: 'getServices' })
  async getServices(
    @Args('input') input: ServicesInquiryInput,
  ): Promise<ServicesInquiryResult> {
    return this.serviceService.getServices(input);
  }

  @Public()
  @Query(() => ServiceGraphType, { name: 'getService', nullable: true })
  async getService(@Args('id') id: string): Promise<ServiceGraphType | null> {
    return this.serviceService.findById(id) as any;
  }

  @Public()
  @Query(() => [ServiceGraphType], { name: 'getServicesByAgency' })
  async getServicesByAgency(@Args('agencyId') agencyId: string): Promise<ServiceGraphType[]> {
    return this.serviceService.findByAgency(agencyId) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ServiceGraphType, { name: 'createService' })
  async createService(
    @Args('agencyId') agencyId: string,
    @Args('input') input: CreateServiceInput,
    @CurrentUser() _user: any,
  ): Promise<ServiceGraphType> {
    const agency = await this.agencyService.findById(agencyId);
    if (!agency) throw new Error('Agency not found');

    const service = await this.serviceService.create(input, agencyId);
    await this.agencyService.incrementField(agency._id, 'totalServices');
    return service as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => ServiceGraphType, { name: 'updateService' })
  async updateService(
    @Args('id') id: string,
    @Args('input') input: UpdateServiceInput,
  ): Promise<ServiceGraphType> {
    return this.serviceService.update(id, input) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => Boolean, { name: 'deleteService' })
  async deleteService(@Args('id') id: string): Promise<boolean> {
    await this.serviceService.delete(id);
    return true;
  }
}
