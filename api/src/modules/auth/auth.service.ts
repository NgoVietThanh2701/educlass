import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { UserNameUtil } from '@common/utils/username.util';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { RoleUser } from '@prisma/client';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { SALT_ROUNDS, SEQUENCE } from './auth.constants';
import { OtpService } from '@modules/otp/otp.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UsersService } from '@modules/users/users.service';
import { AppException } from '@common/exceptions/app.exception';
import { UserResponseDto } from '@modules/users/dto/user-response.dto';
import { OTP_PURPOSE } from '@common/constants/purpose-otp.constant';
import { toUserResponse, userSelect } from '@modules/users/user.mapper';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly userService: UsersService,
  ) {}

  // Register a new teacher
  async register(registerDto: RegisterDto): Promise<UserResponseDto> {
    const { email, fullName, password } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      throw AppException.conflict('User with this email already exists');
    }

    try {
      // 1. Get teacher Number from sequence
      const teacherNo = await this.prisma.nextSequence(SEQUENCE.TEACHER);
      // 2. Generate username using the teacher number
      const userName = UserNameUtil.teacher(teacherNo);
      // 3. Hash the password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await this.prisma.user.create({
        data: {
          email,
          fullName,
          userName,
          passwordHash,
          role: RoleUser.TEACHER,
        },
        select: userSelect,
      });

      // Send OTP for user verify
      await this.otpService.sendOtp(email, OTP_PURPOSE.REGISTER);

      return toUserResponse(user);
    } catch (error) {
      console.error('Error during registration:', error);
      throw AppException.internal('An error occurred during registration. Please try again later.');
    }
  }

  // Refresh access token
  async refreshTokens(userId: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
    if (!user) throw AppException.notFound('User not found');
    const tokens = await this.generateTokens(user.id, user.userName);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: toUserResponse(user),
    };
  }

  // Verify OTP for register
  async verifyOtpRegister(otp: VerifyOtpDto): Promise<AuthResponseDto> {
    const { email, code } = otp;

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { ...userSelect, archivedAt: true, emailVerified: true },
    });
    if (!user || user.archivedAt) throw AppException.notFound('User not found or disabled');

    if (user.emailVerified) throw AppException.badRequest('Email already verified');

    await this.otpService.verifyOtp(email, code, OTP_PURPOSE.REGISTER);
    await this.userService.markEmailVerified(email, user.fullName);

    const tokens = await this.generateTokens(user.id, user.userName);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: toUserResponse(user),
    };
  }

  // Resend OTP
  async resendOtpRegister(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { archivedAt: true, emailVerified: true },
    });
    if (!user || user.archivedAt) throw AppException.notFound('User not found or disabled');
    if (user.emailVerified) throw AppException.badRequest('Email already verified');

    await this.otpService.resendOtp(email, OTP_PURPOSE.REGISTER);
  }

  // Login for an existing teacher and student
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { identifier, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { userName: identifier }],
      },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw AppException.unauthorized('Invalid credentials');
    }

    if ((!user.emailVerified && user.role === RoleUser.TEACHER) || user.archivedAt)
      throw AppException.forbidden('Please verified email or user is disabled');

    const tokens = await this.generateTokens(user.id, user.userName);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: toUserResponse(user),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const { newPassword } = dto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      throw AppException.notFound('User not found');
    }

    if (!user.mustChangePassword) {
      throw AppException.badRequest('Password change is not required');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);

    if (isSamePassword) {
      throw AppException.badRequest('New password must be different from the current password');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        refreshToken: null,
      },
    });
  }

  // =============== private function
  private async generateTokens(
    userId: string,
    userName: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, userName };
    const refreshId = randomBytes(16).toString('hex');
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(
        { ...payload, refreshId },
        {
          secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
          expiresIn: Number(this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN')),
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
