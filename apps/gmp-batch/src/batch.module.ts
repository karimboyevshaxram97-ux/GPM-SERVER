import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { DatabaseModule } from './database/database.module';
import { Agency, AgencySchema } from './schemas/Agency.model';
import { Service, ServiceSchema } from './schemas/Service.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Agency.name, schema: AgencySchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [BatchController],
  providers: [BatchService],
})
export class BatchModule {}
