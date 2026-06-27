import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from '../../schemas/Service.model';
import { ServiceService } from './service.service';
import { ServiceResolver } from './service.resolver';
import { AgencyModule } from '../agency/agency.module';
import { UserModule } from '../user/user.module';
import { ViewModule } from '../view/view.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
    UserModule,
    forwardRef(() => AgencyModule),
    ViewModule,
  ],
  providers: [ServiceService, ServiceResolver],
  exports: [ServiceService],
})
export class ServiceModule {}
