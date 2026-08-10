import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendOtpDto, VerifyOtpDto } from './dto/verify-otp.dto';
import { StrictThrottle, ModerateThrottle } from '@common/decorators/custom-throttler.decorator';
import { SuccessMessage } from '@common/decorators/message.decorator';
import { UserResponseDto } from '@modules/users/dto/user-response.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { Response } from 'express';
import { REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE_OPTIONS } from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Register a new teacher or student
  @Post('register')
  @StrictThrottle()
  @HttpCode(HttpStatus.CREATED)
  @SuccessMessage('The account has been successfully registered')
  @ApiOperation({
    summary: 'Register a new teacher or student',
    description: 'Create a new teacher or student account and send OTP verification',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The account has been successfully registered',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - validation failed or user already exists',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many requests. Rate limit exceeded',
  })
  register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(registerDto);
  }

  // Verify email after registering
  @Post('register/verify-otp')
  @StrictThrottle()
  @HttpCode(HttpStatus.OK)
  @SuccessMessage('OTP verified successfully')
  @ApiOperation({
    summary: 'Verify OTP',
    description: 'Verify the OTP sent to the user email',
  })
  @ApiBody({
    type: VerifyOtpDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified successfully.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired OTP.',
  })
  async verifyOtpRegister(
    @Body() verifyDto: VerifyOtpDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.verifyOtpRegister(verifyDto);

    response.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  // Resend verify OTP
  @Post('register/resend-verification')
  @StrictThrottle()
  @HttpCode(HttpStatus.OK)
  @SuccessMessage('OTP resend to email successfully')
  @ApiOperation({
    summary: 'Resend OTP',
    description: 'OTP resent to the user email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired OTP.',
  })
  resendOtpRegister(@Body() body: ResendOtpDto): Promise<void> {
    return this.authService.resendOtpRegister(body.email);
  }

  // Login for an existing teacher and student
  @Post('login')
  @StrictThrottle()
  @HttpCode(HttpStatus.OK)
  @SuccessMessage('Logged in successfully')
  @ApiOperation({
    summary: 'Login for an existing teacher and student',
    description: 'Authenticate a user and returns access and refresh tokens',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logged in successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid credentials',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many requests. Rate limit exceeded',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(loginDto);

    response.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  // Refresh access token
  @Post('refresh')
  @ModerateThrottle()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth('JWT-refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generates a new access token using a valid refresh token.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Access token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid or expired refresh token',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many requests. Rate limit exceeded',
  })
  async refresh(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.refreshTokens(userId);

    response.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('change-password')
  @ModerateThrottle()
  @HttpCode(HttpStatus.OK)
  @SuccessMessage('Change password successfully')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth('JWT-refresh')
  @ApiOperation({
    summary: 'Change password on first login',
    description: 'Change password with first login (student)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Change password successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many requests. Rate limit exceeded',
  })
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto): Promise<void> {
    return this.authService.changePassword(userId, dto);
  }
}
