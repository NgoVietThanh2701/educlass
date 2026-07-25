import { MailService } from '@modules/mail/mail.service';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { UserResponseDto } from './dto/user-response.dto';
import { toUserResponse, userSelect } from './user.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // Get profile
  async getCurrentProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: userSelect });
    if (!user) throw AppException.notFound('User not found');
    return toUserResponse(user);
  }

  // Mark user email is verified
  async markEmailVerified(email: string, fullName: string) {
    await this.prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    await this.mailService.sendWelcomeEmail(email, fullName);
  }
}
