import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: (configService: ConfigService) => {
    const isProduction = configService.get('NODE_ENV') === 'production';

    const logger = new Logger('RedisProvider');
    const redisInstance = new Redis({
      host: configService.getOrThrow('REDIS_HOST'),
      port: Number(configService.getOrThrow('REDIS_PORT')),
      db: Number(configService.getOrThrow('REDIS_DB')),

      ...(isProduction && {
        password: configService.getOrThrow('REDIS_PASSWORD'),
        tls: {},
      }),

      retryStrategy(times) {
        // Retry sau mỗi 2 giây, tối đa 10 lần
        if (times > 10) {
          throw new Error('Redis connection retry limit exceeded');
        }
        return Math.min(times * 200, 2000);
      },
      reconnectOnError(err) {
        // Tự động reconnect với một số lỗi
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true; // reconnect
        }
        return false;
      },
    });
    // Log khi kết nối thành công và lỗi
    redisInstance.on('connect', () => {
      logger.log('Redis connected successfully');
    });
    redisInstance.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    return redisInstance;
  },
  inject: [ConfigService],
};
