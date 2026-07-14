import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SupportTicket,
  SupportTicketSchema,
} from '../../schemas/SupportTicket.model';
import { SupportResolver } from './support.resolver';
import { SupportService } from './support.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportTicket.name, schema: SupportTicketSchema },
    ]),
  ],
  providers: [SupportService, SupportResolver],
})
export class SupportModule {}
