import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { View, ViewSchema } from '../../schemas/View.model';
import { Agency, AgencySchema } from '../../schemas/Agency.model';
import { Service, ServiceSchema } from '../../schemas/Service.model';
import { Photo, PhotoSchema } from '../../schemas/Photo.model';
import { ViewService } from './view.service';
import { ViewResolver } from './view.resolver';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: View.name, schema: ViewSchema },
      { name: Agency.name, schema: AgencySchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Photo.name, schema: PhotoSchema },
    ]),
    AnalyticsModule,
  ],
  providers: [ViewService, ViewResolver],
  exports: [ViewService],
})
export class ViewModule {}
