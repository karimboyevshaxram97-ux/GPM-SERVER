import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AgencyService } from './agency.service';
import { ServiceService } from '../service/service.service';
import { AgencyType } from '../../libs/dto/agency/agency.type';
import { CreateAgencyInput, UpdateAgencyInput } from '../../libs/dto/agency/agency.input';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from '../auth/guards/gql-roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../libs/enums/user.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => AgencyType)
export class AgencyResolver {
  constructor(
    private readonly agencyService: AgencyService,
    private readonly serviceService: ServiceService,
  ) {}

  @Public()
  @Query(() => [AgencyType], { name: 'agencies' })
  async agencies(): Promise<AgencyType[]> {
    return this.agencyService.findAll() as any;
  }

  @Public()
  @Query(() => AgencyType, { name: 'agency', nullable: true })
  async agency(@Args('id') id: string): Promise<AgencyType | null> {
    return this.agencyService.findById(id) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AgencyType, { name: 'createAgency' })
  async createAgency(
    @Args('input') input: CreateAgencyInput,
    @CurrentUser() user: any,
  ): Promise<AgencyType> {
    return this.agencyService.create(input, user._id.toString()) as any;
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => AgencyType, { name: 'updateAgency' })
  async updateAgency(
    @Args('id') id: string,
    @Args('input') input: UpdateAgencyInput,
  ): Promise<AgencyType> {
    return this.agencyService.update(id, input) as any;
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => Boolean, { name: 'deleteAgency' })
  async deleteAgency(@Args('id') id: string): Promise<boolean> {
    await this.agencyService.delete(id);
    return true;
  }

  @Public()
  @Query(() => [String], { name: 'agencyServiceIds' })
  async agencyServiceIds(@Args('agencyId') agencyId: string): Promise<string[]> {
    const services = await this.serviceService.findByAgency(agencyId);
    return services.map((service) => service._id.toString());
  }
}
