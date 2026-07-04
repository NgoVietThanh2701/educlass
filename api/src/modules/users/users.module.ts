import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MailModule } from '@modules/mail/mail.module';
import { UsersController } from './users.controller';

@Module({
  imports: [MailModule],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
