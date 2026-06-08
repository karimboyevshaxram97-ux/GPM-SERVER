import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AgencyStatType, ServiceStatType } from '../../libs/dto/analytics/analytics.type';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { GqlRolesGuard } from '../auth/guards/gql-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../libs/enums';

@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [AgencyStatType], { name: 'agencyStats' })
  async agencyStats(
    @Args('agencyId') agencyId: string,
    @Args('from', { nullable: true }) from?: Date,
    @Args('to', { nullable: true }) to?: Date,
  ): Promise<AgencyStatType[]> {
    return this.analyticsService.getAgencyStats(agencyId, from, to) as any;
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [ServiceStatType], { name: 'serviceStats' })
  async serviceStats(
    @Args('serviceId') serviceId: string,
    @Args('from', { nullable: true }) from?: Date,
    @Args('to', { nullable: true }) to?: Date,
  ): Promise<ServiceStatType[]> {
    return this.analyticsService.getServiceStats(serviceId, from, to) as any;
  }
}
