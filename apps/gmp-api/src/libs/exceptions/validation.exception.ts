import { BadRequestException } from '@nestjs/common';

export class ValidationException extends BadRequestException {
  constructor(
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super({
      statusCode: 400,
      message,
      errors,
    });
  }
}
