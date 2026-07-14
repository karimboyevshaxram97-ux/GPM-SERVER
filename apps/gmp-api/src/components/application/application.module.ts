import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Application,
  ApplicationSchema,
} from '../../schemas/Application.model';
import { ApplicationService } from './application.service';
import { ApplicationResolver } from './application.resolver';
import { ServiceModule } from '../service/service.module';
import { AgencyModule } from '../agency/agency.module';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
    ]),
    ServiceModule,
    AgencyModule,
    UserModule,
    NotificationModule,
  ],
  providers: [ApplicationService, ApplicationResolver],
  exports: [ApplicationService],
})
export class ApplicationModule {}
