import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { BatchModule } from '../src/batch.module';

describe('Batch App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [BatchModule]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/batch (GET)', () => {
    return request(app.getHttpServer()).get('/batch').expect(200).expect({ status: 'GMP batch alive' });
  });
});
