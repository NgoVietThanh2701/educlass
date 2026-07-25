import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { MailModule } from './modules/mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { OtpModule } from './modules/otp/otp.module';
import { UsersModule } from './modules/users/users.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { ClassModule } from './modules/class/class.module';
import { ExamsModule } from './modules/exams/exams.module';
import { ExamSessionModule } from './modules/exam-session/exam-session.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExamAttemptModule } from './modules/exam-attempt/exam-attempt.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    AuthModule,
    PrismaModule,
    RedisModule,
    MailModule,
    OtpModule,
    UsersModule,
    ClassModule,
    ExamsModule,
    ExamSessionModule,
    ExamAttemptModule,
    ChatModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
