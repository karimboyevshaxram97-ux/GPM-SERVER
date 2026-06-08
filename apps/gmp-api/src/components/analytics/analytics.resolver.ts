import { Resolver, Query, Args } from '@nestjs/graphql';
import { AnalyticsService } from './analytics.service';
import { AgencyStatType, ServiceStatType } from '../../libs/dto/analytics/analytics.type';

@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => [AgencyStatType], { name: 'agencyStats' })
  async agencyStats(
    @Args('agencyId') agencyId: string,
    @Args('from', { nullable: true }) from?: Date,
    @Args('to', { nullable: true }) to?: Date,
  ): Promise<AgencyStatType[]> {
    console.log('Query: agencyStats');
    return this.analyticsService.getAgencyStats(agencyId, from, to) as any;
  }

  @Query(() => [ServiceStatType], { name: 'serviceStats' })
  async serviceStats(
    @Args('serviceId') serviceId: string,
    @Args('from', { nullable: true }) from?: Date,
    @Args('to', { nullable: true }) to?: Date,
  ): Promise<ServiceStatType[]> {
    console.log('Query: serviceStats');
    return this.analyticsService.getServiceStats(serviceId, from, to) as any;
  }
}
