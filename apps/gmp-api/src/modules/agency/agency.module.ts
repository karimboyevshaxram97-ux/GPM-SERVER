import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Agency, AgencySchema } from './schemas/agency.schema';
import { AgencyService } from './agency.service';
import { AgencyResolver } from './agency.resolver';
import { ServiceModule } from '../service/service.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([{ name: Agency.name, schema: AgencySchema }]),
    UserModule,
    forwardRef(() => ServiceModule),
  ],
  providers: [AgencyService, AgencyResolver],
  exports: [AgencyService],
})
export class AgencyModule {}
