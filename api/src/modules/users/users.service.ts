import { MailService } from '@modules/mail/mail.service';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { AppException } from '@common/exceptions/app.exception';
import { UserResponseDto } from './dto/user-response.dto';
import { toUserResponse } from './user.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // Get profile
  async getCurrentProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    if (!user) throw AppException.notFound('User not found');
    return toUserResponse(user);
  }

  // Find user by email
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  //Find user by id
  findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  // Find user by email or username
  findByUserName(userName: string) {
    return this.prisma.user.findUnique({
      where: { userName },
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
