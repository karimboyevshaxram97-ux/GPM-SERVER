import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Agency, AgencySchema } from './schemas/agency.schema';
import { AgencyService } from './agency.service';
import { AgencyResolver } from './agency.resolver';

@Module({
  imports: [MongooseModule.forFeature([{ name: Agency.name, schema: AgencySchema }])],
  providers: [AgencyService, AgencyResolver],
  exports: [AgencyService],
})
export class AgencyModule {}
