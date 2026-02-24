import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception?.code === 'LIMIT_FILE_SIZE') {
      return response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        message: 'File size exceeds 2MB limit',
      });
    }

    throw exception;
  }
}
