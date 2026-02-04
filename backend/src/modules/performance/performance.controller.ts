import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { ScalingService } from './services/scaling.service';
import { ConnectionPoolService } from './services/connection-pool.service';
import { AlertingService } from './services/alerting.service';
import { QueueService } from './services/queue.service';
import { DatabaseOptimizationService } from './services/database-optimization.service';
import { CacheService } from './services/cache.service';

@Controller('performance')
export class PerformanceController {
  constructor(
    private readonly performanceService: PerformanceService,
    private readonly scalingService: ScalingService,
    private readonly connectionPool: ConnectionPoolService,
    private readonly alertingService: AlertingService,
    private readonly queueService: QueueService,
    private readonly dbOptimization: DatabaseOptimizationService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('overview')
  async getOverview() {
    return this.performanceService.getPerformanceOverview();
  }

  @Get('health')
  async getHealth() {
    return this.performanceService.getHealthStatus();
  }

  @Get('recommendations')
  async getRecommendations() {
    return this.performanceService.getOptimizationRecommendations();
  }

  @Post('test')
  async runTest(
    @Body() body: { duration: number; concurrentUsers: number; endpoint: string },
  ) {
    return this.performanceService.runPerformanceTest(body);
  }

  @Post('optimize/database')
  async optimizeDatabase() {
    return this.performanceService.optimizeDatabase();
  }

  @Post('clear')
  async clearCaches() {
    return this.performanceService.clearCaches();
  }

  @Get('scaling')
  getScalingStatus() {
    return this.scalingService.getStats();
  }

  @Get('scaling/config')
  getScalingConfig() {
    return this.scalingService.getConfig();
  }

  @Post('scaling/scale')
  async manualScale(@Body() body: { targetInstances: number }) {
    await this.scalingService.manualScale(body.targetInstances);
    return { success: true, message: `Scaling to ${body.targetInstances} instances` };
  }

  @Get('pool')
  getPoolStats() {
    return this.connectionPool.getStats();
  }

  @Get('pool/config')
  getPoolConfig() {
    return this.connectionPool.getConfig();
  }

  @Get('queue')
  getQueueStats() {
    return this.queueService.getMetrics();
  }

  @Get('alerts')
  getAlerts(@Query('status') status?: string) {
    return {
      stats: this.alertingService.getStats(),
      firing: this.alertingService.getAlerts('firing'),
      rules: this.alertingService.getAlertRules(),
    };
  }

  @Post('alerts/:id/acknowledge')
  acknowledgeAlert(@Param('id') id: string, @Body() body: { acknowledgedBy: string }) {
    const success = this.alertingService.acknowledgeAlert(id, body.acknowledgedBy);
    return { success };
  }

  @Get('queries/slow')
  getSlowQueries(@Query('threshold') threshold?: number) {
    const queries = this.dbOptimization.getSlowQueries(threshold || 100);
    return { queries };
  }

  @Get('queries/stats')
  getQueryStats() {
    const statistics = this.dbOptimization.getQueryStatistics();
    return { statistics };
  }

  @Get('cache/stats')
  async getCacheStats() {
    return this.cacheService.getStats();
  }

  @Post('cache/invalidate')
  async invalidateCache(@Body() body: { tag: string }) {
    await this.cacheService.invalidateByTag(body.tag);
    return { success: true };
  }
}
