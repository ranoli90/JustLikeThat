import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisClusterService } from './cluster/redis-cluster.service';
import { RedisSentinelService } from './sentinel/redis-sentinel.service';
import { RedisStreamsService } from './streams/redis-streams.service';

@Global()
@Module({
  providers: [
    RedisService,
    RedisClusterService,
    RedisSentinelService,
    RedisStreamsService,
  ],
  exports: [
    RedisService,
    RedisClusterService,
    RedisSentinelService,
    RedisStreamsService,
  ],
})
export class RedisModule {}
