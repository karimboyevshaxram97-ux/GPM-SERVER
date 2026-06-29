import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schemas/User.model';
import { Agency, AgencySchema } from '../../schemas/Agency.model';
import { Application, ApplicationSchema } from '../../schemas/Application.model';
import { Review, ReviewSchema } from '../../schemas/Review.model';
import { Service, ServiceSchema } from '../../schemas/Service.model';
import { AuditLog, AuditLogSchema } from '../../schemas/AuditLog.model';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Agency.name, schema: AgencySchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  providers: [AdminService, AdminResolver],
})
export class AdminModule {}
