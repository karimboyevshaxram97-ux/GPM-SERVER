import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { ServiceService } from './service.service';
import { AgencyService } from '../agency/agency.service';
import { ServiceGraphType } from './dto/service.type';
import { CreateServiceInput, UpdateServiceInput } from './dto/service.input';
import { GqlJwtAuthGuard } from '../../common/guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from '../../common/guards/gql-roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => ServiceGraphType)
export class ServiceResolver {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly agencyService: AgencyService,
  ) {}

  @Public()
  @Query(() => [ServiceGraphType], { name: 'services' })
  async services(): Promise<ServiceGraphType[]> {
    return this.serviceService.findAll() as any;
  }

  @Public()
  @Query(() => ServiceGraphType, { name: 'service', nullable: true })
  async service(@Args('id') id: string): Promise<ServiceGraphType | null> {
    return this.serviceService.findById(id) as any;
  }

  @Public()
  @Query(() => [ServiceGraphType], { name: 'servicesByAgency' })
  async servicesByAgency(@Args('agencyId') agencyId: string): Promise<ServiceGraphType[]> {
    return this.serviceService.findByAgency(agencyId) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ServiceGraphType, { name: 'createService' })
  async createService(
    @Args('agencyId') agencyId: string,
    @Args('input') input: CreateServiceInput,
    @CurrentUser() user: any,
  ): Promise<ServiceGraphType> {
    const agency = await this.agencyService.findById(agencyId);
    if (!agency) {
      throw new Error('Agency not found');
    }

    return this.serviceService.create(input, agencyId) as any;
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => ServiceGraphType, { name: 'updateService' })
  async updateService(
    @Args('id') id: string,
    @Args('input') input: UpdateServiceInput,
  ): Promise<ServiceGraphType> {
    return this.serviceService.update(id, input) as any;
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => Boolean, { name: 'deleteService' })
  async deleteService(@Args('id') id: string): Promise<boolean> {
    await this.serviceService.delete(id);
    return true;
  }
}
