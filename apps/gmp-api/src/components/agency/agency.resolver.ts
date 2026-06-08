import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, InternalServerErrorException } from '@nestjs/common';
import { AgencyService } from './agency.service';
import { ServiceService } from '../service/service.service';
import { AgencyType } from '../../libs/dto/agency/agency.type';
import { AgenciesInquiryInput } from '../../libs/dto/agency/agencies-inquiry.input';
import { AgenciesInquiryResult } from '../../libs/dto/agency/agencies-inquiry.result';
import { CreateAgencyInput, UpdateAgencyInput } from '../../libs/dto/agency/agency.input';
import { GqlRolesGuard } from '../auth/guards/gql-roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { WithoutAuth } from '../auth/guards/without.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, Message } from '../../libs/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => AgencyType)
export class AgencyResolver {
  constructor(
    private readonly agencyService: AgencyService,
    private readonly serviceService: ServiceService,
  ) {}

  @WithoutAuth()
  @Query(() => AgenciesInquiryResult, { name: 'getAgencies' })
  async getAgencies(
    @Args('input') input: AgenciesInquiryInput,
    @CurrentUser() user: any,
  ): Promise<AgenciesInquiryResult> {
    console.log('Query: getAgencies');
    return this.agencyService.getAgencies(input, user?._id?.toString());
  }

  @Public()
  @Query(() => AgencyType, { name: 'getAgency', nullable: true })
  async getAgency(@Args('id') id: string): Promise<AgencyType | null> {
    console.log('Query: getAgency');
    return this.agencyService.findById(id) as any;
  }

  @Public()
  @Query(() => AgencyType, { name: 'getAgencyBySlug', nullable: true })
  async getAgencyBySlug(@Args('slug') slug: string): Promise<AgencyType | null> {
    console.log('Query: getAgencyBySlug');
    return this.agencyService.findBySlug(slug) as any;
  }

  @Mutation(() => AgencyType, { name: 'createAgency' })
  async createAgency(
    @Args('input') input: CreateAgencyInput,
    @CurrentUser() user: any,
  ): Promise<AgencyType> {
    console.log('Mutation: createAgency');
    return this.agencyService.create(input, user._id.toString()) as any;
  }

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => AgencyType, { name: 'updateAgency' })
  async updateAgency(
    @Args('id') id: string,
    @Args('input') input: UpdateAgencyInput,
  ): Promise<AgencyType> {
    console.log('Mutation: updateAgency');
    return this.agencyService.update(id, input) as any;
  }

  @UseGuards(GqlRolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Mutation(() => Boolean, { name: 'deleteAgency' })
  async deleteAgency(@Args('id') id: string): Promise<boolean> {
    console.log('Mutation: deleteAgency');
    await this.agencyService.delete(id);
    return true;
  }
}
