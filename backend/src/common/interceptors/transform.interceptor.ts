import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const http = context.switchToHttp();
    const response = http.getResponse();
    const statusCode = response.statusCode ?? 200;

    return next.handle().pipe(
      map((res) => {
        // If already formatted, return as-is
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return {
            ...res,
            statusCode: res.statusCode ?? statusCode,
            timestamp: res.timestamp ?? new Date().toISOString(),
          };
        }

        // Extract custom message if present in returned object
        let message = 'Operation completed successfully';
        let data = res;

        if (res && typeof res === 'object' && '_message' in res) {
          message = res._message;
          const { _message, ...rest } = res;
          data = rest;
        }

        return {
          success: true,
          statusCode,
          message,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
