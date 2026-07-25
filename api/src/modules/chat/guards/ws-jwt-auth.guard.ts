import { AppException } from '@common/exceptions/app.exception';
import { AuthenticatedSocket, JwtPayload } from '@common/interfaces/auth-user.interface';
import { AuthValidationService } from '@modules/auth/auth-validation.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authValidationService: AuthValidationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: AuthenticatedSocket = context.switchToWs().getClient<AuthenticatedSocket>();
    const token = client.handshake.auth.token ?? client.handshake.query.token;
    if (typeof token !== 'string') throw AppException.unauthorized('Invalid token in ws-jwt');

    const payload = this.jwtService.verify<JwtPayload>(token);
    client.user = await this.authValidationService.validateJwtPayload(payload);

    return true;
  }
}
