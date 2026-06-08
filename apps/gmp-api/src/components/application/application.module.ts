import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from '../../schemas/Application.model';
import { ApplicationService } from './application.service';
import { ApplicationResolver } from './application.resolver';
import { ServiceModule } from '../service/service.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }]),
    ServiceModule,
    UserModule,
  ],
  providers: [ApplicationService, ApplicationResolver],
  exports: [ApplicationService],
})
export class ApplicationModule {}
