import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { Metric, MetricGroup, MetricType } from './entities/metric.entity';
import { Alert, AlertType, AlertSeverity, AlertStatus, NotificationChannel } from './entities/alert.entity';
import { CostControl, CostControlType, CostControlStatus } from './entities/cost-control.entity';
import { LogEntry, LogLevel } from './entities/log-entry.entity';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  // Metrics
  @Post('metrics')
  async recordMetric(
    @Body() body: { group: MetricGroup; name: string; type: MetricType; value: number; metadata?: Record<string, any> },
  ): Promise<Metric> {
    return this.monitoringService.recordMetric(
      body.group,
      body.name,
      body.type,
      body.value,
      body.metadata,
    );
  }

  @Get('metrics')
  async getMetricsByGroup(
    @Query('group') group: MetricGroup,
    @Query('start') start: string,
    @Query('end') end: string,
  ): Promise<Metric[]> {
    return this.monitoringService.getMetricsByGroup(group, {
      start: new Date(start),
      end: new Date(end),
    });
  }

  @Get('metrics/stats')
  async getMetricStats(
    @Query('group') group: MetricGroup,
    @Query('name') name: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ): Promise<{ count: number; avg: number; min: number; max: number; sum: number }> {
    return this.monitoringService.getMetricStats(group, name, {
      start: new Date(start),
      end: new Date(end),
    });
  }

  // Alerts
  @Post('alerts')
  async createAlert(
    @Body() body: {
      type: AlertType;
      severity: AlertSeverity;
      title: string;
      description: string;
      metadata?: Record<string, any>;
      channels?: NotificationChannel[];
    },
  ): Promise<Alert> {
    return this.monitoringService.createAlert(
      body.type,
      body.severity,
      body.title,
      body.description,
      body.metadata,
      body.channels,
    );
  }

  @Get('alerts')
  async getActiveAlerts(): Promise<Alert[]> {
    return this.monitoringService.getActiveAlerts();
  }

  @Put('alerts/:id/acknowledge')
  async acknowledgeAlert(@Param('id') id: string): Promise<Alert | null> {
    return this.monitoringService.acknowledgeAlert(id);
  }

  @Put('alerts/:id/resolve')
  async resolveAlert(@Param('id') id: string): Promise<Alert | null> {
    return this.monitoringService.resolveAlert(id);
  }

  // Cost Controls
  @Post('cost-controls')
  async createCostControl(
    @Body() body: {
      type: CostControlType;
      name: string;
      limit: number;
      description?: string;
      unit?: string;
      conditions?: Record<string, any>;
      actions?: Record<string, any>;
    },
  ): Promise<CostControl> {
    return this.monitoringService.createCostControl(
      body.type,
      body.name,
      body.limit,
      body.description,
      body.unit,
      body.conditions,
      body.actions,
    );
  }

  @Get('cost-controls/check')
  async checkCostControls(@Query('type') type?: CostControlType): Promise<CostControl[]> {
    if (type) {
      return this.monitoringService.checkCostControl(type);
    }
    
    const results: CostControl[] = [];
    const types = Object.values(CostControlType);
    
    for (const t of types) {
      const controls = await this.monitoringService.checkCostControl(t);
      results.push(...controls);
    }
    
    return results;
  }

  // Logging
  @Post('logs')
  async log(
    @Body() body: {
      level: LogLevel;
      message: string;
      metadata?: Record<string, any>;
      category?: string;
      module?: string;
      requestId?: string;
    },
  ): Promise<LogEntry> {
    return this.monitoringService.log(
      body.level,
      body.message,
      body.metadata,
      body.category,
      body.module,
      body.requestId,
    );
  }

  @Get('logs')
  async getLogs(
    @Query('level') level?: LogLevel,
    @Query('category') category?: string,
    @Query('module') module?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ): Promise<LogEntry[]> {
    const timeRange = start && end ? {
      start: new Date(start),
      end: new Date(end),
    } : undefined;
    
    return this.monitoringService.getLogs(level, category, module, timeRange);
  }

  // Anomaly Detection
  @Post('detect-anomalies')
  async detectAnomalies(): Promise<Alert[]> {
    return this.monitoringService.detectAnomalies();
  }

  // Runbooks
  @Get('runbooks')
  async getRunbooks(): Promise<any[]> {
    return this.monitoringService.getRunbooks();
  }

  // Validation
  @Get('validation-playbooks')
  async getValidationPlaybooks(): Promise<any[]> {
    return this.monitoringService.getValidationPlaybooks();
  }

  // System Health Check
  @Get('health')
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    return {
      status: 'healthy',
      timestamp: new Date(),
    };
  }
}
