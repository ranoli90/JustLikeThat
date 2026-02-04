import { Module, Global } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { DatabaseOptimizationService } from './services/database-optimization.service';
import { CacheService } from './services/cache.service';
import { CompressionService } from './services/compression.service';
import { QueueService } from './services/queue.service';
import { ScalingService } from './services/scaling.service';
import { ConnectionPoolService } from './services/connection-pool.service';
import { MetricsService } from './services/metrics.service';
import { AlertingService } from './services/alerting.service';

@Global()
@Module({
  controllers: [PerformanceController],
  providers: [
    PerformanceService,
    DatabaseOptimizationService,
    CacheService,
    CompressionService,
    QueueService,
    ScalingService,
    ConnectionPoolService,
    MetricsService,
    AlertingService,
  ],
  exports: [
    PerformanceService,
    DatabaseOptimizationService,
    CacheService,
    CompressionService,
    QueueService,
    ScalingService,
    ConnectionPoolService,
    MetricsService,
    AlertingService,
  ],
})
export class PerformanceModule {}
