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
      map((data) => ({
        success: true,
        message,
        data: data ?? null,
      })),
    );
  }
}
