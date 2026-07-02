import { MailService } from '@modules/mail/mail.service';
import { RedisService } from '@modules/redis/redis.service';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  MAX_OTP_SEND_ATTEMPTS,
  MAX_OTP_VERIFY_ATTEMPTS,
  OTP_PREFIX,
  OTP_RATE_LIMIT_PREFIX,
  OTP_VERIFY_ATTEMPT_PREFIX,
  SALT_ROUNDS_OTP,
} from './otp.constant';
import { PurposeOTP } from '@prisma/client';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCode } from '@common/exceptions/error-codes.exception';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpTtl: number;
  private readonly otpRateLimitTtl: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.otpTtl = Number(this.configService.getOrThrow('OTP_TTL'));
    this.otpRateLimitTtl = Number(this.configService.getOrThrow('OTP_RATE_LIMIT'));
  }

  /**
   * Tạo mã OTP ngẫu nhiên 6 chữ số
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Tạo key Redis cho OTP
   */
  private getOtpKey(email: string, purpose: PurposeOTP): string {
    return `${OTP_PREFIX}${purpose}:${email}`;
  }

  private getRateLimitKey(email: string, purpose: PurposeOTP): string {
    return `${OTP_RATE_LIMIT_PREFIX}${purpose}:${email}`;
  }

  private getVerifyAttemptKey(email: string, purpose: PurposeOTP): string {
    return `${OTP_VERIFY_ATTEMPT_PREFIX}${purpose}:${email}`;
  }

  /**
   * Gửi OTP qua email
   */
  async sendOtp(email: string, purpose: PurposeOTP): Promise<void> {
    // Kiểm tra rate limit
    const rateLimitKey = this.getRateLimitKey(email, purpose);
    const attempts = await this.redisService.get(rateLimitKey);
    const currentAttempts = attempts ? parseInt(attempts, 10) : 0;

    if (currentAttempts >= MAX_OTP_SEND_ATTEMPTS) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST_OTP_RATE_LIMIT,
        `Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau.`,
      );
    }

    // Cập nhật rate limit: tăng số lần gửi, nếu chưa có thì set TTL 1 giờ
    if (currentAttempts === 0) {
      await this.redisService.set(rateLimitKey, '1', this.otpRateLimitTtl);
    } else {
      await this.redisService.incr(rateLimitKey);
    }

    // Tạo OTP
    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS_OTP);
    const otpKey = this.getOtpKey(email, purpose);

    // Lưu OTP vào Redis với TTL
    await this.redisService.set(otpKey, String(otpHash), this.otpTtl);

    // Gửi email
    const purposeLabel = this.getPurposeLabel(purpose);
    await this.mailService.sendOtpEmail(email, otp, purposeLabel, this.otpTtl / 60);

    this.logger.log(`OTP sent to ${email} for ${purpose}`);
  }

  /**
   * Xác thực OTP
   */
  async verifyOtp(email: string, code: string, purpose: PurposeOTP): Promise<void> {
    const otpKey = this.getOtpKey(email, purpose);
    const verifyAttemptKey = this.getVerifyAttemptKey(email, purpose);
    const storedOtp = await this.redisService.get(otpKey);

    // OTP đúng
    if (storedOtp && (await bcrypt.compare(code, storedOtp))) {
      await this.redisService.del([otpKey, verifyAttemptKey]);
      this.logger.log(`OTP verified for ${email} (${purpose})`);
      return;
    }

    // OTP sai
    const attemptValue = await this.redisService.get(verifyAttemptKey);
    const currentAttempts = attemptValue ? Number(attemptValue) : 0;
    const nextAttempts = currentAttempts + 1;

    if (currentAttempts === 0) {
      // Chỉ tạo key ở lần nhập sai đầu tiên
      await this.redisService.set(verifyAttemptKey, String(nextAttempts), this.otpTtl);
    } else {
      await this.redisService.incr(verifyAttemptKey);
    }

    if (nextAttempts >= MAX_OTP_VERIFY_ATTEMPTS) {
      await this.redisService.del([otpKey, verifyAttemptKey]);
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST_OTP_ATTEMPT,
        'Bạn đã nhập sai OTP quá nhiều lần. Mã OTP đã bị hủy, vui lòng yêu cầu mã OTP mới.',
      );
    }

    throw new AppException(
      HttpStatus.BAD_REQUEST,
      ErrorCode.BAD_REQUEST_OTP_WRONG,
      `Mã OTP không chính xác. Bạn còn ${MAX_OTP_VERIFY_ATTEMPTS - nextAttempts} lần thử.`,
    );
  }

  /**
   * Cho phép gửi lại OTP (gọi lại sendOtp nhưng có thể reset rate limit nếu muốn)
   */
  async resendOtp(email: string, purpose: PurposeOTP): Promise<void> {
    // Có thể xóa rate limit cũ trước khi gọi sendOtp, hoặc giữ nguyên
    // Ở đây giữ nguyên để rate limit vẫn áp dụng
    await this.sendOtp(email, purpose);
  }

  private getPurposeLabel(purpose: PurposeOTP): string {
    switch (purpose) {
      case PurposeOTP.REGISTER:
        return 'đăng ký tài khoản';
      case PurposeOTP.RESET_PASSWORD:
        return 'đặt lại mật khẩu';
      case PurposeOTP.CHANGE_EMAIL:
        return 'thay đổi email';
      default:
        return '';
    }
  }
}
