import {
  Injectable,
  Logger,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { tap, type Observable } from 'rxjs';

/** One log line per request:  GET /api/v1/products 200 — 12ms */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const startedAt = Date.now();

    const log = (statusCode: number) =>
      this.logger.log(
        `${request.method} ${request.originalUrl} ${statusCode} — ${Date.now() - startedAt}ms`,
      );

    return next.handle().pipe(
      tap({
        next: () => log(http.getResponse<Response>().statusCode),
        error: (error: unknown) =>
          log(
            error instanceof Error && 'getStatus' in error
              ? (error as { getStatus(): number }).getStatus()
              : 500,
          ),
      }),
    );
  }
}
