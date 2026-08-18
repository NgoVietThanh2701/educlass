import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { AppConfig } from '@common/constants/app-config.constant';
import { AppException } from '@common/exceptions/app.exception';
import { GoogleOAuthService } from './google-oauth.service';
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
  getRefreshTokenCookieOptions,
} from './auth.constants';

@ApiTags('Auth')
@Controller('auth')
export class GoogleOAuthController {
  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @ApiOperation({ summary: 'Redirect to the Google OAuth consent screen' })
  loginWithGoogle(@Res() res: Response) {
    const state = randomBytes(16).toString('hex');
    res.cookie(GOOGLE_OAUTH_STATE_COOKIE, state, GOOGLE_OAUTH_STATE_COOKIE_OPTIONS);
    return res.redirect(this.googleOAuthService.buildAuthorizationUrl(state));
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback — exchanges code, links/creates the user' })
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!code) {
      throw AppException.badRequest('Missing authorization code');
    }

    // CSRF protection: the `state` must match the cookie set at /auth/google.
    const savedState = req.cookies?.[GOOGLE_OAUTH_STATE_COOKIE];
    if (!savedState || savedState !== state) {
      throw AppException.badRequest('Invalid OAuth state');
    }
    res.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, GOOGLE_OAUTH_STATE_COOKIE_OPTIONS);

    const { refreshToken } = await this.googleOAuthService.handleCallback(code);

    // Same refresh-cookie mechanism as password login. Because the request
    // arrives through the Next.js proxy (GOOGLE_CALLBACK_URL is the web origin),
    // the cookie is scoped to the web host → F5/logout/refresh all work as usual.
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshTokenCookieOptions());

    const appUrl = this.configService.get('ALLOWED_ORIGINS') ?? AppConfig.APP_URL;
    return res.redirect(`${appUrl}/oauth/callback`);
  }
}
