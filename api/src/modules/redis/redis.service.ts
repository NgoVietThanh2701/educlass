import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, 'EX', ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  /**
   * Xóa một hoặc nhiều key
   */
  async del(key: string | string[]): Promise<number> {
    if (Array.isArray(key)) {
      return this.redis.del(...key);
    }
    return this.redis.del(key);
  }

  /**
   * Tăng giá trị số (dùng cho rate limit)
   */
  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.redis.decr(key);
  }

  /**
   * Đặt thời gian hết hạn cho key (nếu chưa có)
   */
  async expire(key: string, seconds: number): Promise<number> {
    return await this.redis.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  /**
   * Kiểm tra kết nối Redis (ping)
   */
  async ping(): Promise<string> {
    return this.redis.ping();
  }
}
