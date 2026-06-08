import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from '../../schemas/Service.model';
import { ServiceService } from './service.service';
import { ServiceResolver } from './service.resolver';
import { AgencyModule } from '../agency/agency.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
    UserModule,
    forwardRef(() => AgencyModule),
  ],
  providers: [ServiceService, ServiceResolver],
  exports: [ServiceService],
})
export class ServiceModule {}
