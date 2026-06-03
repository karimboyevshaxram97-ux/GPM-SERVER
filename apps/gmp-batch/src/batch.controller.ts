import { Controller, Get } from '@nestjs/common';
import { BatchService } from './batch.service';

@Controller('batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get()
  getStatus() {
    return this.batchService.getStatus();
  }
}
