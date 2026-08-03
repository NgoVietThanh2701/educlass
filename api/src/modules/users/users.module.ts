import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MailModule } from '@modules/mail/mail.module';
import { UsersController } from './users.controller';
import { UserCleanupCron } from './jobs/user-cleanup.job';

@Module({
  imports: [MailModule],
  providers: [UsersService, UserCleanupCron],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
