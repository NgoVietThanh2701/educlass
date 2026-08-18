import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider, RoleUser } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { UserNameUtil } from '@common/utils/username.util';
import { SEQUENCE } from './auth.constants';
import { AuthService } from './auth.service';
import { userSelect, toUserResponse } from '@modules/users/user.mapper';
import { UserResponseDto } from '@modules/users/dto/user-response.dto';

interface GoogleProfile {
  id: string;
  email?: string;
  verified_email?: boolean;
  name?: string;
}

/**
 * Google OAuth — authorization-code flow implemented with plain `fetch`
 * (no extra dependency). The callback exchange follows the standard:
 *   code → token (oauth2.googleapis.com/token) → userinfo (v2/userinfo).
 */
@Injectable()
export class GoogleOAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  buildAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.configService.getOrThrow('GOOGLE_CLIENT_ID'),
      redirect_uri: this.googleCallbackUrl(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<{ user: UserResponseDto; refreshToken: string }> {
    const profile = await this.fetchVerifiedProfile(code);

    // Find by googleId first (existing Google account).
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.id },
      select: userSelect,
    });

    if (!user) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: profile.email! },
        select: { id: true, archivedAt: true },
      });

      if (existingByEmail) {
        if (existingByEmail.archivedAt) {
          throw AppException.forbidden('Account is disabled');
        }
        // Auto-link: same email already has an EMAIL account -> attach googleId
        // (passwordHash is kept, so both login methods keep working).
        user = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId: profile.id,
            provider: AuthProvider.GOOGLE,
            emailVerified: true,
          },
          select: userSelect,
        });
      } else {
        const sequenceNo = await this.prisma.nextSequence(SEQUENCE.STUDENT);
        const userName = UserNameUtil.student(sequenceNo);
        try {
          user = await this.prisma.user.create({
            data: {
              email: profile.email!,
              fullName: profile.name?.trim() || 'New User',
              userName,
              passwordHash: null,
              provider: AuthProvider.GOOGLE,
              googleId: profile.id,
              role: RoleUser.STUDENT,
              emailVerified: true,
            },
            select: userSelect,
          });
        } catch {
          // Concurrent duplicate (same email/googleId happened twice) → return
          // the record that actually persisted.
          user = await this.prisma.user.findUnique({
            where: { email: profile.email! },
            select: userSelect,
          });
          if (!user) {
            throw AppException.conflict('Could not link Google account');
          }
        }
      }
    }

    const tokens = await this.authService.generateTokens(user.id, user.userName);
    await this.authService.updateRefreshToken(user.id, tokens.refreshToken);

    return { user: toUserResponse(user), refreshToken: tokens.refreshToken };
  }

  private googleCallbackUrl(): string {
    return this.configService.getOrThrow('GOOGLE_CALLBACK_URL');
  }

  /** Exchanges the code for tokens, fetches the profile and validates `email_verified`. */
  private async fetchVerifiedProfile(code: string): Promise<GoogleProfile> {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.configService.getOrThrow('GOOGLE_CLIENT_ID'),
        client_secret: this.configService.getOrThrow('GOOGLE_CLIENT_SECRET'),
        redirect_uri: this.googleCallbackUrl(),
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!tokenRes.ok) {
      throw AppException.unauthorized('Failed to exchange Google authorization code');
    }

    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      throw AppException.unauthorized('Google did not return an access token');
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileRes.ok) {
      throw AppException.unauthorized('Failed to fetch Google profile');
    }

    const profile = (await profileRes.json()) as GoogleProfile;
    if (!profile.id || !profile.email || profile.verified_email !== true) {
      throw AppException.unauthorized('Google account email is not verified');
    }

    return profile;
  }
}
