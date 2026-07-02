import { MailService } from '@modules/mail/mail.service';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // Find user by email
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, userName: true, fullName: true },
    });
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
