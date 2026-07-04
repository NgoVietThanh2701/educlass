// Guard for protecting refresh token endpoints

import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}
