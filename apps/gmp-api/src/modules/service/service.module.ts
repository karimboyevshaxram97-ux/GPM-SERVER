import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from './schemas/service.schema';
import { ServiceService } from './service.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }])],
  providers: [ServiceService],
  exports: [ServiceService],
})
export class ServiceModule {}
