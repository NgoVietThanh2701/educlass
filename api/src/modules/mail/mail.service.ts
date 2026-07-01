import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MAIL_SUBJECT, MAIL_TEMPLATE } from './mail.constants';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly supportEmail: string;
  private readonly appUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {
    this.supportEmail = config.getOrThrow('MAIL_SUPPORT');
    this.appUrl = config.getOrThrow('APP_URL');
  }

  async onModuleInit() {
    try {
      await (this.mailerService as any).transporter.verify();
      this.logger.log('SMTP connection established successfully.');
    } catch (err) {
      this.logger.error('SMTP verification failed.', err);
      throw err;
    }
  }

  /**
   * Gửi email với template
   * @param to - địa chỉ người nhận
   * @param subject - tiêu đề
   * @param template - tên file template (không cần đuôi .hbs)
   * @param context - dữ liệu truyền vào template
   */
  async sendMail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    try {
      const info = await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
      this.logger.log(JSON.stringify(info));
      this.logger.log(`Email sent to ${to} with template "${template}"`);
    } catch (error) {
      console.error('Error during service mail:', error);
      throw new InternalServerErrorException('Unable to send email');
    }
  }

  /**
   * Gửi email OTP - tiện ích nhanh
   */
  async sendOtpEmail(to: string, otp: string, purpose: string, ttlMinutes: number): Promise<void> {
    await this.sendMail(to, `${MAIL_SUBJECT.OTP} - ${purpose}`, MAIL_TEMPLATE.OTP, {
      otp,
      purpose,
      ttl: ttlMinutes,
      supportEmail: this.supportEmail,
    });
  }

  /**
   * Gửi email chào mừng
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    await this.sendMail(to, MAIL_SUBJECT.WELCOME, MAIL_TEMPLATE.WELCOME, {
      userName,
      loginUrl: this.appUrl,
    });
  }
}
