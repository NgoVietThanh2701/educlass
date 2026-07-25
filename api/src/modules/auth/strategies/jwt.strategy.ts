// JWT strategy for auth requests
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser, JwtPayload } from '@common/interfaces/auth-user.interface';
import { AuthValidationService } from '../auth-validation.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authValidateService: AuthValidationService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  // validate the user from the JWT payload
  validate(payload: JwtPayload): Promise<AuthUser> {
    return this.authValidateService.validateJwtPayload(payload);
  }
}
