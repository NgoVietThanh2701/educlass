import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MailModule } from '@modules/mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
