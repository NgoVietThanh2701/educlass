import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { SequenceService } from '@common/database/sequence.service';
import { SALT_ROUNDS, SEQUENCE } from '@common/constants';
import { UserNameUtil } from '@common/utils/username.util';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { RoleUser } from '@prisma/client';
import { UserMapper } from '@modules/users/mapper/user.mapper';
import { UserSelect } from '@modules/users/selects/user.select';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly sequenceService: SequenceService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, fullName, password } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    try {
      // 1. Get teacher Number from sequence
      const teacherNo = await this.sequenceService.next(SEQUENCE.TEACHER);
      // 2. Generate username using the teacher number
      const userName = UserNameUtil.teacher(teacherNo);
      // 3. Hash the password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await this.prisma.user.create({
        data: {
          email,
          fullName,
          passwordHash,
          role: RoleUser.TEACHER,
          teacherNo,
          userName,
        },
        select: UserSelect.authUser,
      });

      const tokens = await this.generateTokens(user.id, user.userName);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      return {
        ...tokens,
        user: UserMapper.toResponse(user),
      };
    } catch (error) {
      console.error('Error during registration:', error);
      throw new InternalServerErrorException(
        'An error occurred during registration. Please try again later.',
      );
    }
  }

  private async generateTokens(
    userId: string,
    userName: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, userName };
    const refreshId = randomBytes(16).toString('hex');
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: Number(this.configService.getOrThrow<number>('JWT_EXPIRES_IN')),
      }),
      this.jwtService.signAsync(
        { ...payload, refreshId },
        {
          secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
          expiresIn: Number(this.configService.getOrThrow<number>('JWT_REFRESH_EXPIRES_IN')),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }
}
