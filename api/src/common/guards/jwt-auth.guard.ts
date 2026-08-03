// Jwt auth guard
import { AppException } from '@common/exceptions/app.exception';
import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: Error, user: any, info: any) {
    // Xử lý lỗi xác thực (token sai, hết hạn...)
    if (err || !user) {
      this.logger.warn(
        `JWT authentication failed: ${info?.name ?? err?.name ?? 'Unknown'} - ${
          info?.message ?? err?.message ?? 'No details'
        }`,
      );
      throw AppException.unauthorized('Token is missing or invalid');
    }
    return user;
  }
}
