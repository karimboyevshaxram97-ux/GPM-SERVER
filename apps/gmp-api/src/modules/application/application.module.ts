import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from './schemas/application.schema';
import { ApplicationService } from './application.service';
import { ApplicationResolver } from './application.resolver';

@Module({
  imports: [MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }])],
  providers: [ApplicationService, ApplicationResolver],
  exports: [ApplicationService],
})
export class ApplicationModule {}
