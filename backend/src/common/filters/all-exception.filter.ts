import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

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

    // 🔥 Обработка ошибки дубликата (PostgreSQL unique violation)
    if (
      exception instanceof QueryFailedError &&
      (exception as any).code === '23505'
    ) {
      const driverError = (exception as QueryFailedError).driverError as {
        detail?: string;
        table?: string;
      };

      let message = 'Запись с таким уникальным значением уже существует';

      if (driverError?.detail) {
        /**
         * Пример detail:
         * Key (email)=(test@test.com) already exists.
         */
        const match = driverError.detail.match(
          /Key \((.+?)\)=\((.+?)\) already exists/,
        );

        if (match) {
          const [, field, value] = match;
          const table = driverError.table ?? 'Запись';

          message = `${table} с таким ${field} ${value} уже существует`;
        } else if (driverError.table) {
          message = `${driverError.table} с таким уникальным значением уже существует`;
        }
      }

      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      return response
        .status(status)
        .json(
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