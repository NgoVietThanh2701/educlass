import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class UserCleanupCron {
  private readonly logger = new Logger(UserCleanupCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async removeUnverifiedUsers() {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);

    const result = await this.prisma.user.deleteMany({
      where: {
        emailVerified: false,
        createdAt: {
          lt: cutoff,
        },
      },
    });

    this.logger.log(`Removed ${result.count} unverified users older than 5 minutes`);
  }
}
