import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './schemas/review.schema';
import { ReviewService } from './review.service';
import { ReviewResolver } from './review.resolver';
import { AgencyModule } from '../agency/agency.module';
import { ServiceModule } from '../service/service.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    AgencyModule,
    ServiceModule,
  ],
  providers: [ReviewService, ReviewResolver],
  exports: [ReviewService],
})
export class ReviewModule {}
