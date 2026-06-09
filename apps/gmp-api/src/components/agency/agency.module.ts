import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Agency, AgencySchema } from '../../schemas/Agency.model';
import { AgencyService } from './agency.service';
import { AgencyResolver } from './agency.resolver';
import { UserModule } from '../user/user.module';
import { ViewModule } from '../view/view.module';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([{ name: Agency.name, schema: AgencySchema }]),
    UserModule,
    ViewModule,
  ],
  providers: [AgencyService, AgencyResolver],
  exports: [AgencyService],
})
export class AgencyModule {}
