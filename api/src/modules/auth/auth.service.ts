import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { UserNameUtil } from '@common/utils/username.util';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PurposeOTP, RoleUser } from '@prisma/client';
import { UserMapper } from '@modules/users/mapper/user.mapper';
import { UserSelect } from '@modules/users/selects/user.select';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { SALT_ROUNDS, SEQUENCE } from './auth.constants';
import { OtpService } from '@modules/otp/otp.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UsersService } from '@modules/users/users.service';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCode } from '@common/exceptions/error-codes.exception';

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
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, fullName, password } = registerDto;

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'User with this email already exists',
      );
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
          passwordHash,
          role: RoleUser.TEACHER,
          teacherNo,
          userName,
        },
        select: UserSelect.authUser,
      });

      const tokens = await this.generateTokens(user.id, user.userName);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      // Send OTP for user verify
      await this.otpService.sendOtp(email, PurposeOTP.REGISTER);

      return {
        ...tokens,
        user: UserMapper.toResponse(user),
      };
    } catch (error) {
      console.error('Error during registration:', error);
      throw new AppException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER_ERROR,
        'An error occurred during registration. Please try again later.',
      );
    }
  }

  // Verify OTP
  async verifyOtp(otp: VerifyOtpDto): Promise<void> {
    const { email, code, purpose } = otp;

    const user = await this.userService.findByEmail(email);
    if (!user)
      throw new AppException(HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST, 'User not found');

    await this.otpService.verifyOtp(email, code, purpose);

    switch (purpose) {
      case PurposeOTP.REGISTER:
        await this.userService.markEmailVerified(email, user.fullName);
        break;
      case PurposeOTP.RESET_PASSWORD:
        break;
      default:
        break;
    }
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
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        'Invalid email or password',
      );
    }

    const tokens = await this.generateTokens(user.id, user.userName);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: UserMapper.toResponse(user),
    };
  }

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
