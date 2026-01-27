import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, PayloadTooLargeException } from '@nestjs/common';
import { Response } from 'express';
import { EntityNotFoundError } from 'typeorm';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof EntityNotFoundError) {
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Сущность не найдена',
      });
    }

    if (exception instanceof PayloadTooLargeException) {
      return response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: 'Слишком большой размер файла',
      });
    }

    if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      (exception as any).code === '23505'
    ) {
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'Запись с такими данными уже существует',
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      return response.status(status).json(
        typeof res === 'string'
          ? { statusCode: status, message: res }
          : res,
      );
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Внутренняя ошибка сервера',
    });
  }
}
