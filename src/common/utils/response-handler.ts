import { HttpException } from '@nestjs/common';
import { serializeBigInt } from './bigint-serializer';

export class ResponseHandler {
  static ok(message: string, data: any = null) {
    return {
      statusCode: 200,
      message,
      success: true,
      data: serializeBigInt(data),
    };
  }

  static error(message: string, error: any = null, statusCode = 500): never {
    throw new HttpException(
      {
        statusCode,
        message,
        success: false,
        error,
      },
      statusCode,
    );
  }
}
