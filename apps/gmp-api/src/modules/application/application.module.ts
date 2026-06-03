import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from './schemas/application.schema';
import { ApplicationService } from './application.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }])],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
