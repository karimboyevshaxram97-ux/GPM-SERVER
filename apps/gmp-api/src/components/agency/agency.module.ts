import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Agency, AgencySchema } from '../../schemas/Agency.model';
import { AgencyService } from './agency.service';
import { AgencyResolver } from './agency.resolver';
import { UserModule } from '../user/user.module';
import { ViewModule } from '../view/view.module';
import { ServiceModule } from '../service/service.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Agency.name, schema: AgencySchema }]),
    UserModule,
    ViewModule,
    forwardRef(() => ServiceModule),
  ],
  providers: [AgencyService, AgencyResolver],
  exports: [AgencyService],
})
export class AgencyModule {}
