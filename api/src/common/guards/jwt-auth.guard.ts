// Jwt auth guard
import { SKIP_PASSWORD_CHECK_KEY } from '@common/decorators/skip-password-check';
import { AppException } from '@common/exceptions/app.exception';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: Error, user: any, info: any, context: ExecutionContext) {
    // Xử lý lỗi xác thực (token sai, hết hạn...)
    if (err || !user) {
      throw AppException.unauthorized('Token is missing or invalid');
    }
    const skipPasswordCheck = this.reflector.getAllAndOverride<boolean>(SKIP_PASSWORD_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (user.mustChangePassword && !skipPasswordCheck) {
      throw AppException.forbidden('You must change your password before accessing this resource');
    }
    return user;
  }
}
