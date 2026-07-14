import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgencyStat, AgencyStatSchema } from '../../schemas/AgencyStat.model';
import {
  ServiceStat,
  ServiceStatSchema,
} from '../../schemas/ServiceStat.model';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgencyStat.name, schema: AgencyStatSchema },
      { name: ServiceStat.name, schema: ServiceStatSchema },
    ]),
  ],
  providers: [AnalyticsService, AnalyticsResolver],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
