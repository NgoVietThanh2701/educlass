// Refresh Token Strategy
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import * as bycrypt from 'bcrypt';
import { PrismaService } from '@prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { UserSelect } from '@modules/users/selects/user.select';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  //validate fresher token
  async validate(req: Request, payload: { sub: string }) {
    console.log('RefreshTokenStrategy.validate called');

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      console.error('No authorization header found');
      throw AppException.unauthorized('Refresh token not provided');
    }

    const refreshToken = authHeader.replace('Bearer', '').trim();
    if (!refreshToken) {
      throw AppException.unauthorized('Refresh token is empty after extraction');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: UserSelect.full,
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
