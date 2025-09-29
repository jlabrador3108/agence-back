import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomException extends HttpException {
  constructor(message = 'Bad request', statusCode = HttpStatus.BAD_REQUEST) {
    super(
      {
        message,
        statusCode,
        error: HttpStatus[statusCode] || 'Bad Request',
      },
      statusCode,
    );
  }
}
