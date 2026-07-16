import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ApplicationDocument,
  ApplicationDocumentSchema,
} from '../../schemas/ApplicationDocument.model';
import { ApplicationDocumentController } from './application-document.controller';
import { ApplicationDocumentResolver } from './application-document.resolver';
import { ApplicationDocumentService } from './application-document.service';
import { ApplicationModule } from '../application/application.module';
import { AgencyModule } from '../agency/agency.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApplicationDocument.name, schema: ApplicationDocumentSchema },
    ]),
    ApplicationModule,
    AgencyModule,
  ],
  controllers: [ApplicationDocumentController],
  providers: [ApplicationDocumentService, ApplicationDocumentResolver],
  exports: [ApplicationDocumentService],
})
export class ApplicationDocumentModule {}
