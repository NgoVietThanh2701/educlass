import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MAIL_SUBJECT, MAIL_TEMPLATE } from './mail.constants';
import { OtpMailContext, WelcomeMailContext } from './mail.type';
import { AppException } from '@common/exceptions/app.exception';
import { AppConfig } from '@common/constants/app-config.constant';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly supportEmail: string;

  constructor(
    private readonly mailerService: MailerService,
    config: ConfigService,
  ) {
    this.supportEmail = config.getOrThrow('MAIL_SUPPORT');
  }

  async onModuleInit() {
    try {
      const transporter = this.mailerService.getTransporter();
      await transporter.verify();
      this.logger.log('SMTP connection established successfully.');
    } catch (err) {
      this.logger.error('SMTP verification failed.', err);
    }
  }

  /**
   * Gửi email với template
   * @param to - địa chỉ người nhận
   * @param subject - tiêu đề
   * @param template - tên file template (không cần đuôi .hbs)
   * @param context - dữ liệu truyền vào template
   */
  async sendMail<T extends object>(
    to: string,
    subject: string,
    template: string,
    context: T,
  ): Promise<void> {
    try {
      const info = await this.mailerService.sendMail({
        to,
        subject,
        template,
        context: {
          ...context,
          currentYear: new Date().getFullYear(),
        },
      });
      this.logger.log(JSON.stringify(info));
      this.logger.log(`Email sent to ${to} with template "${template}"`);
    } catch (error) {
      this.logger.error('Error during service mail:', error);
      throw AppException.internal('Unable to send email');
    }
  }

  /**
   * Gửi email OTP - tiện ích nhanh
   */
  async sendOtpEmail(to: string, otp: string, purpose: string, ttlMinutes: number): Promise<void> {
    await this.sendMail<OtpMailContext>(to, `${MAIL_SUBJECT.OTP} - ${purpose}`, MAIL_TEMPLATE.OTP, {
      otp,
      purpose,
      ttl: ttlMinutes,
      supportEmail: this.supportEmail,
    });
  }

  /**
   * Gửi email chào mừng
   */
  async sendWelcomeEmail(to: string, fullName: string): Promise<void> {
    await this.sendMail<WelcomeMailContext>(to, MAIL_SUBJECT.WELCOME, MAIL_TEMPLATE.WELCOME, {
      fullName,
      loginUrl: AppConfig.APP_URL,
    });
  }
}
