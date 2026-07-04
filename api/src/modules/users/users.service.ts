import { MailService } from '@modules/mail/mail.service';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { UserSelect } from './selects/user.select';
import { AppException } from '@common/exceptions/app.exception';
import { UserMapper } from './mapper/user.mapper';
import { UserResponseDto } from './dto/user-response.dto';

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
    return UserMapper.toResponse(user);
  }

  // Find user by email
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: UserSelect.full,
    });
  }

  //Find user by id
  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: UserSelect.full,
    });
  }

  // Find user by email or username
  async findByEmailOrUserName(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { userName: identifier }],
      },
      select: UserSelect.full,
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
