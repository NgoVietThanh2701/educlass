import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: (configService: ConfigService) => {
    const redisInstance = new Redis({
      host: configService.getOrThrow('REDIS_HOST'),
      port: Number(configService.getOrThrow('REDIS_PORT')),
      db: Number(configService.getOrThrow('REDIS_DB')),
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
      console.log('Redis connected successfully');
    });
    redisInstance.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    return redisInstance;
  },
  inject: [ConfigService],
};
