import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { RedisModule } from '@modules/redis/redis.module';
import { MailModule } from '@modules/mail/mail.module';

@Module({
  providers: [OtpService],
  imports: [MailModule, RedisModule],
  exports: [OtpService],
})
export class OtpModule {}
