import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/response.interface';
import { Reflector } from '@nestjs/core';
import { SUCCESS_MESSAGE } from '@common/constants/message.constant';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const message = this.reflector.get<string>(SUCCESS_MESSAGE, context.getHandler());
    return next.handle().pipe(
      map((data): ApiResponse<T> => {
        // Redirect endpoints (e.g. Google OAuth `/auth/google`) already sent
        // headers — wrapping the body would throw "headers already sent".
        const response = context.switchToHttp().getResponse<{ headersSent?: boolean }>();
        if (response?.headersSent) {
          return data as unknown as ApiResponse<T>;
        }
        return {
          success: true,
          message,
          data: data ?? null,
        };
      }),
    );
  }
}
