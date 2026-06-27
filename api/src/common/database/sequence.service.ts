import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class SequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async next(sequenceName: string): Promise<number> {
    const result = await this.prisma.$queryRaw<{ nextval: bigint }[]>(
      Prisma.sql`
        SELECT nextval(${sequenceName}::regclass)::bigint AS nextval
      `,
    );

    return Number(result[0].nextval);
  }
}
