import { ROLES_USER_KEY } from '@common/decorators/roles.decorator';
import { AppException } from '@common/exceptions/app.exception';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleUser } from '@prisma/client';

@Injectable()
export class RolesUserGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleUser[]>(ROLES_USER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.some((role) => role === user.role);
    if (!hasRole) {
      throw AppException.forbidden('Not permission');
    }
    return true;
  }
}
