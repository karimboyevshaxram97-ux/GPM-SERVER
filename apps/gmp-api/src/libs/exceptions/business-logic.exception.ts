import { BadRequestException } from '@nestjs/common';

export class BusinessLogicException extends BadRequestException {
  constructor(
    message: string,
    public code: string,
  ) {
    super({
      statusCode: 400,
      message,
      code,
    });
  }
}
