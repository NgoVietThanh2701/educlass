// Refresh Token Strategy
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Injectable, Logger } from '@nestjs/common';
import * as bycrypt from 'bcrypt';
import { PrismaService } from '@prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { REFRESH_TOKEN_COOKIE } from '../auth.constants';

const refreshTokenExtractor = (request: Request): string | null => {
  return request.cookies?.[REFRESH_TOKEN_COOKIE] ?? null;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  private readonly logger = new Logger(RefreshTokenStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: refreshTokenExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  //validate fresher token
  async validate(req: Request, payload: { sub: string }) {
    this.logger.log('RefreshTokenStrategy.validate called');

    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw AppException.unauthorized('Refresh token not provided');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken) {
      throw AppException.unauthorized('Invalid refresh token');
    }

    const refreshTokenMatches = await bycrypt.compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) {
      throw AppException.unauthorized('Invalid refresh does not match');
    }

    return user;
  }
}
