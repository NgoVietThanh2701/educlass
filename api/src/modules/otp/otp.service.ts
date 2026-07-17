import { MailService } from '@modules/mail/mail.service';
import { RedisService } from '@modules/redis/redis.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  KEY_OTP_PREFIX,
  KeyOtpPrefix,
  MAX_OTP_RATE_LIMIT,
  MAX_OTP_VERIFY_ATTEMPTS,
  SALT_ROUNDS_OTP,
} from './otp.constant';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCode } from '@common/exceptions/error-codes.exception';
import { OTP_PURPOSE, OtpPurposeType } from '@common/constants/purpose-otp.constant';

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

  private getOtpKey(email: string, purpose: OtpPurposeType, prefix: KeyOtpPrefix): string {
    return `${prefix}${purpose}:${email}`;
  }

  /**
   * Gửi OTP qua email
   */
  async sendOtp(email: string, purpose: OtpPurposeType): Promise<void> {
    // Get key
    const otpKey = this.getOtpKey(email, purpose, KEY_OTP_PREFIX.OTP);
    const rateLimitKey = this.getOtpKey(email, purpose, KEY_OTP_PREFIX.OTP_RATE_LIMIT);
    const verifyAttemptKey = this.getOtpKey(email, purpose, KEY_OTP_PREFIX.OTP_VERIFY_ATTEMPT);

    const attempts = await this.redisService.incr(rateLimitKey); // 1
    if (attempts === 1) {
      await this.redisService.expire(rateLimitKey, this.otpRateLimitTtl);
    }

    if (attempts > MAX_OTP_RATE_LIMIT) {
      throw AppException.badRequest(
        'Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau.',
        ErrorCode.BAD_REQUEST_OTP_RATE_LIMIT,
      );
    }

    try {
      const otp = this.generateOtp();
      const otpHash = await bcrypt.hash(otp, SALT_ROUNDS_OTP);

      // OTP mới => reset số lần nhập sai
      await this.redisService.del(verifyAttemptKey);
      await this.redisService.set(otpKey, String(otpHash), this.otpTtl);
      // Gửi email
      const purposeLabel = this.getPurposeLabel(purpose);
      await this.mailService.sendOtpEmail(email, otp, purposeLabel, this.otpTtl / 60);

      this.logger.log(`OTP sent to ${email} for ${purpose}`);
    } catch (error) {
      // Rollback OTP nếu gửi mail thất bại
      await Promise.all([
        this.redisService.del([otpKey, verifyAttemptKey]),
        this.redisService.decr(rateLimitKey),
      ]);
      throw error;
    }
  }

  /**
   * Xác thực OTP
   */
  async verifyOtp(email: string, code: string, purpose: OtpPurposeType): Promise<void> {
    const otpKey = this.getOtpKey(email, purpose, KEY_OTP_PREFIX.OTP);
    const verifyAttemptKey = this.getOtpKey(email, purpose, KEY_OTP_PREFIX.OTP_VERIFY_ATTEMPT);

    // 1. check OTP
    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp) {
      // Dọn luôn attempt nếu còn sót
      await this.redisService.del(verifyAttemptKey);
      throw AppException.badRequest('Please resent OTP', ErrorCode.BAD_REQUEST_OTP_RESEND);
    }

    // 2. OTP đúng
    if (await bcrypt.compare(code, storedOtp)) {
      await this.redisService.del([otpKey, verifyAttemptKey]);
      this.logger.log(`OTP verified for ${email} (${purpose})`);
      return;
    }

    // 3. OTP sai -> tăng số lần thử
    const attempts = await this.redisService.incr(verifyAttemptKey);

    // Chỉ set TTL ở lần tạo đầu tiên
    if (attempts === 1) {
      await this.redisService.expire(verifyAttemptKey, this.otpTtl);
    }

    if (attempts >= MAX_OTP_VERIFY_ATTEMPTS) {
      await this.redisService.del([otpKey, verifyAttemptKey]);
      throw AppException.badRequest(
        'Bạn đã nhập sai OTP quá nhiều lần. Mã OTP đã bị hủy, vui lòng yêu cầu mã OTP mới.',
        ErrorCode.BAD_REQUEST_OTP_RESEND,
      );
    }

    throw AppException.badRequest(
      `Mã OTP không chính xác. Bạn còn ${MAX_OTP_VERIFY_ATTEMPTS - attempts} lần thử.`,
      ErrorCode.BAD_REQUEST_OTP_WRONG,
    );
  }

  /**
   * Cho phép gửi lại OTP (gọi lại sendOtp nhưng có thể reset rate limit nếu muốn)
   */
  async resendOtp(email: string, purpose: OtpPurposeType): Promise<void> {
    await this.sendOtp(email, purpose);
  }

  private getPurposeLabel(purpose: OtpPurposeType): string {
    switch (purpose) {
      case OTP_PURPOSE.REGISTER:
        return 'đăng ký tài khoản';
      case OTP_PURPOSE.RESET_PASSWORD:
        return 'đặt lại mật khẩu';
      case OTP_PURPOSE.CHANGE_EMAIL:
        return 'thay đổi email';
      default:
        return '';
    }
  }
}
