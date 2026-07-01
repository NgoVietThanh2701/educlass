import { MailService } from '@modules/mail/mail.service';
import { RedisService } from '@modules/redis/redis.service';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MAX_OTP_ATTEMPTS,
  OTP_DEFAULT_TTL,
  OTP_PREFIX,
  OTP_RATE_LIMIT_PREFIX,
} from './otp.constant';
import { PurposeOTP } from '@prisma/client';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpTtl: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.otpTtl = this.configService.get<number>('OTP_TTL', OTP_DEFAULT_TTL);
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

  /**
   * Tạo key Redis cho rate limit gửi OTP
   */
  private getRateLimitKey(email: string, purpose: PurposeOTP): string {
    return `${OTP_RATE_LIMIT_PREFIX}${purpose}:${email}`;
  }

  /**
   * Gửi OTP qua email
   */
  async sendOtp(email: string, purpose: PurposeOTP): Promise<void> {
    // Kiểm tra rate limit
    const rateLimitKey = this.getRateLimitKey(email, purpose);
    const attempts = await this.redisService.get(rateLimitKey);
    const currentAttempts = attempts ? parseInt(attempts, 10) : 0;

    if (currentAttempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestException(`Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau.`);
    }

    // Cập nhật rate limit: tăng số lần gửi, nếu chưa có thì set TTL 1 giờ
    if (currentAttempts === 0) {
      await this.redisService.set(rateLimitKey, '1', 3600); // 1 giờ
    } else {
      await this.redisService.incr(rateLimitKey);
    }

    // Tạo OTP
    const otp = this.generateOtp();
    const otpKey = this.getOtpKey(email, purpose);

    // Lưu OTP vào Redis với TTL
    await this.redisService.set(otpKey, otp, this.otpTtl);

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
    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp) {
      throw new BadRequestException('Mã OTP không tồn tại hoặc đã hết hạn.');
    }

    if (storedOtp !== code) {
      throw new BadRequestException('Mã OTP không chính xác.');
    }

    // Xóa OTP sau khi xác thực thành công để tránh dùng lại
    await this.redisService.del(otpKey);
    this.logger.log(`OTP verified for ${email} (${purpose})`);
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
