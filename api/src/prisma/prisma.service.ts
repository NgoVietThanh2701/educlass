import { SequenceName } from '@modules/auth/auth.constants';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // POSTGRES CONNECTION HARDENING
    // --------------------------------------------
    // The dataset used is a serverless Postgres (Neon): it aggressively closes
    // idle connections, so a pooled socket that is reused after the server side
    // closed it dies mid-query with `ECONNRESET` ("socket hang up" /
    // "Server has closed the connection." — Prisma then wraps it misleadingly as
    // `Invalid ...findUnique() invocation`). Bounding the pool + short timeouts
    // make those failures fail fast and get replaced by a fresh connection on the
    // next retry (the frontend already retries transient errors for these pages).
    const pgConfig: ConstructorParameters<typeof PrismaPg>[0] & {
      max?: number;
      connectionTimeoutMillis?: number;
      idleTimeoutMillis?: number;
      keepAlive?: boolean;
    } = {
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 60_000,
      keepAlive: true,
    };

    const adapter = new PrismaPg(pgConfig, {
      onConnectionError: (err) =>
        this.logger.warn(
          `Database connection error (will replace dead connection): ${err.message}`,
        ),
      onPoolError: (err) =>
        this.logger.warn(`Database pool error: ${err.message}`),
    });

    super({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    // Eagerly establish the pool during bootstrap so the very first request
    // does not pay a cold-start connection handshake (and is therefore far less
    // likely to be killed by the serverless DB while still connecting).
    await this.$connect();
    this.logger.log('Database connected successfully!');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected!');
  }

  async cleanDatabaseForTesting() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cleaning the database is not allowed in production!');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && !key.startsWith('_'),
    );

    return Promise.all(
      models.map((modelKey) => {
        if (typeof modelKey === 'string') {
          return this[modelKey].deleteMany();
        }
      }),
    );
  }

  async nextSequence(name: SequenceName): Promise<number> {
    const result = await this.$queryRaw<{ nextval: bigint }[]>(
      Prisma.sql`SELECT nextval(${name}::regclass)::bigint AS nextval`,
    );

    return Number(result[0].nextval);
  }
}
