import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { ApiError } from '@milcow/shared';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

/**
 * The last stop for every error thrown anywhere in the API.
 *  - HttpException (NotFoundException, BadRequestException, ...) → sent as is
 *  - Known Prisma errors (unique, foreign key, not found)        → a clear 4xx
 *  - Anything else                                               → 500, details only in the log
 * Every error response has the same shape (ApiError from packages/shared).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const { statusCode, message, error } = this.toHttpError(exception);

    if (statusCode >= 500) {
      // Full stack trace in the server log — never in the response
      this.logger.error(
        `${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiError = {
      statusCode,
      message,
      error,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };
    response.status(statusCode).json(body);
  }

  private toHttpError(exception: unknown): Pick<ApiError, 'statusCode' | 'message' | 'error'> {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const statusCode = exception.getStatus();
      if (typeof res === 'string') return { statusCode, message: res, error: exception.name };
      const { message, error } = res as { message?: string | string[]; error?: string };
      return { statusCode, message: message ?? exception.message, error: error ?? exception.name };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': // unique constraint
          return {
            statusCode: HttpStatus.CONFLICT,
            message: 'This record already exists',
            error: 'Conflict',
          };
        case 'P2003': // foreign key (e.g. deleting something that is still used)
          return {
            statusCode: HttpStatus.CONFLICT,
            message: 'This record is used by other data',
            error: 'Conflict',
          };
        case 'P2025': // record to update/delete/connect not found
          return {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Record not found',
            error: 'Not Found',
          };
        case 'P2000': // value too long for the column
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'A value is too long',
            error: 'Bad Request',
          };
      }
    }

    // PostgreSQL CHECK constraint (e.g. pickup slot overbooked) — SQLSTATE 23514
    if (exception instanceof Error && /check constraint|23514/i.test(exception.message)) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'The request breaks a business rule (e.g. no capacity left)',
        error: 'Conflict',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
