import { Injectable } from '@nestjs/common';

@Injectable()
export class BatchService {
  getStatus() {
    return { status: 'GMP batch alive' };
  }
}
