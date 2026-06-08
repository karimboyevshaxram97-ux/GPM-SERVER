import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from '../../schemas/Review.model';
import { ReviewService } from './review.service';
import { ReviewResolver } from './review.resolver';
import { AgencyModule } from '../agency/agency.module';
import { ServiceModule } from '../service/service.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    AgencyModule,
    ServiceModule,
    UserModule,
  ],
  providers: [ReviewService, ReviewResolver],
  exports: [ReviewService],
})
export class ReviewModule {}
