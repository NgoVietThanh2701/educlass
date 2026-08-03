import { AppException } from '@common/exceptions/app.exception';
import { AuthUser, JwtPayload } from '@common/interfaces/auth-user.interface';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class AuthValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateJwtPayload(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, archivedAt: true, role: true },
    });

    if (!user || user.archivedAt) {
      throw AppException.unauthorized('User not found or disabled');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
