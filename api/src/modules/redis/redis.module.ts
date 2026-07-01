import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisProvider } from './redis.provider';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [RedisService, RedisProvider],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
