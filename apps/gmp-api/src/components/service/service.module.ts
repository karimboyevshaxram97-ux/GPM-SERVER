import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from '../../schemas/Service.model';
import { ServiceService } from './service.service';
import { ServiceResolver } from './service.resolver';
import { AgencyModule } from '../agency/agency.module';
import { UserModule } from '../user/user.module';
import { ViewModule } from '../view/view.module';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
    UserModule,
    AgencyModule,
    ViewModule,
  ],
  providers: [ServiceService, ServiceResolver],
  exports: [ServiceService],
})
export class ServiceModule {}
