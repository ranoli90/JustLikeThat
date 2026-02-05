import { Module, Global } from '@nestjs/common';
import { ShardingService } from './services/sharding.service';
import { ShardStrategyService } from './strategies/shard-strategy.service';

@Global()
@Module({
  providers: [ShardingService, ShardStrategyService],
  exports: [ShardingService, ShardStrategyService],
})
export class ShardingModule {}
