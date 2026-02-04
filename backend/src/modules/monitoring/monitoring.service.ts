import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Metric, MetricGroup, MetricType } from './entities/metric.entity';
import { Alert, AlertType, AlertSeverity, AlertStatus, NotificationChannel } from './entities/alert.entity';
import { CostControl, CostControlType, CostControlStatus } from './entities/cost-control.entity';
import { LogEntry, LogLevel } from './entities/log-entry.entity';

@Injectable()
export class MonitoringService {
  constructor(
    @InjectRepository(Metric)
    private readonly metricRepository: Repository<Metric>,
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(CostControl)
    private readonly costControlRepository: Repository<CostControl>,
    @InjectRepository(LogEntry)
    private readonly logEntryRepository: Repository<LogEntry>,
  ) {}

  // Metrics Collection
  async recordMetric(
    group: MetricGroup,
    name: string,
    type: MetricType,
    value: number,
    metadata?: Record<string, any>,
  ): Promise<Metric> {
    const metric = this.metricRepository.create({
      group,
      name,
      type,
      value,
      metadata,
    });
    return this.metricRepository.save(metric);
  }

  async getMetricsByGroup(group: MetricGroup, timeRange: { start: Date; end: Date }): Promise<Metric[]> {
    return this.metricRepository
      .createQueryBuilder('metric')
      .where('metric.group = :group', { group })
      .andWhere('metric.createdAt >= :start', { start: timeRange.start })
      .andWhere('metric.createdAt <= :end', { end: timeRange.end })
      .orderBy('metric.createdAt', 'ASC')
      .getMany();
  }

  async getMetricStats(group: MetricGroup, name: string, timeRange: { start: Date; end: Date }): Promise<{
    count: number;
    avg: number;
    min: number;
    max: number;
    sum: number;
  }> {
    const metrics = await this.metricRepository
      .createQueryBuilder('metric')
      .where('metric.group = :group', { group })
      .andWhere('metric.name = :name', { name })
      .andWhere('metric.createdAt >= :start', { start: timeRange.start })
      .andWhere('metric.createdAt <= :end', { end: timeRange.end })
      .getMany();

    return {
      count: metrics.length,
      avg: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length,
      min: Math.min(...metrics.map(m => m.value)),
      max: Math.max(...metrics.map(m => m.value)),
      sum: metrics.reduce((sum, m) => sum + m.value, 0),
    };
  }

  // Alerting
  async createAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    description: string,
    metadata?: Record<string, any>,
    channels?: NotificationChannel[],
  ): Promise<Alert> {
    const alert = this.alertRepository.create({
      type,
      severity,
      title,
      description,
      metadata,
      channels,
    });
    return this.alertRepository.save(alert);
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return this.alertRepository.find({
      where: {
        status: AlertStatus.TRIGGERED,
      },
      order: { severity: 'ASC', createdAt: 'DESC' },
    });
  }

  async acknowledgeAlert(id: string): Promise<Alert | null> {
    const alert = await this.alertRepository.findOne({ where: { id } });
    if (alert) {
      alert.status = AlertStatus.ACKNOWLEDGED;
      return this.alertRepository.save(alert);
    }
    return null;
  }

  async resolveAlert(id: string): Promise<Alert | null> {
    const alert = await this.alertRepository.findOne({ where: { id } });
    if (alert) {
      alert.status = AlertStatus.RESOLVED;
      return this.alertRepository.save(alert);
    }
    return null;
  }

  // Cost Controls
  async createCostControl(
    type: CostControlType,
    name: string,
    limit: number,
    description?: string,
    unit?: string,
    conditions?: Record<string, any>,
    actions?: Record<string, any>,
  ): Promise<CostControl> {
    const costControl = this.costControlRepository.create({
      type,
      name,
      limit,
      description,
      unit,
      conditions,
      actions,
    });
    return this.costControlRepository.save(costControl);
  }

  async checkCostControl(type: CostControlType): Promise<CostControl[]> {
    const costControls = await this.costControlRepository.find({
      where: {
        type,
        status: CostControlStatus.ACTIVE,
      },
    });

    const triggeredControls: CostControl[] = [];

    for (const control of costControls) {
      const currentValue = await this.calculateCurrentValue(control);
      
      if (currentValue >= control.limit) {
        control.currentValue = currentValue;
        control.status = CostControlStatus.TRIGGERED;
        await this.costControlRepository.save(control);
        
        triggeredControls.push(control);
        
        await this.createAlert(
          AlertType.COST_CAP,
          AlertSeverity.CRITICAL,
          `Cost Control Triggered: ${control.name}`,
          `Cost control '${control.name}' has been triggered. Current value: ${currentValue}, Limit: ${control.limit} ${control.unit}`,
          {
            costControlId: control.id,
            type: control.type,
            currentValue,
            limit: control.limit,
            unit: control.unit,
          },
        );
      }
    }

    return triggeredControls;
  }

  private async calculateCurrentValue(control: CostControl): Promise<number> {
    const timeRange = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    switch (control.type) {
      case CostControlType.LLM_CALL_LIMIT:
        return (await this.getMetricStats(MetricGroup.COST_TRACKING, 'llm_calls', timeRange)).count;
      case CostControlType.API_RATE_LIMIT:
        return (await this.getMetricStats(MetricGroup.APPLICATION_PERFORMANCE, 'api_requests', timeRange)).count;
      case CostControlType.BUDGET_MONITORING:
        return (await this.getMetricStats(MetricGroup.COST_TRACKING, 'total_cost', timeRange)).sum;
      default:
        return 0;
    }
  }

  // Logging
  async log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    category?: string,
    module?: string,
    requestId?: string,
  ): Promise<LogEntry> {
    const logEntry = this.logEntryRepository.create({
      level,
      message,
      metadata,
      category,
      module,
      requestId,
    });
    return this.logEntryRepository.save(logEntry);
  }

  async getLogs(
    level?: LogLevel,
    category?: string,
    module?: string,
    timeRange?: { start: Date; end: Date },
  ): Promise<LogEntry[]> {
    const where: any = {};

    if (level) where.level = level;
    if (category) where.category = category;
    if (module) where.module = module;
    if (timeRange) {
      where.createdAt = {
        between: [timeRange.start, timeRange.end],
      };
    }

    return this.logEntryRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  // Anomaly Detection (simplified)
  async detectAnomalies(): Promise<Alert[]> {
    const anomalies: Alert[] = [];
    
    const timeRange = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    // Check for unusual high API response times
    const responseTimeStats = await this.getMetricStats(MetricGroup.APPLICATION_PERFORMANCE, 'response_time', timeRange);
    if (responseTimeStats.avg > 5000) {
      anomalies.push(
        await this.createAlert(
          AlertType.ANOMALY,
          AlertSeverity.HIGH,
          'High API Response Time',
          `Average API response time is ${Math.round(responseTimeStats.avg)}ms, which is above the 5000ms threshold`,
          {
            metric: 'response_time',
            average: Math.round(responseTimeStats.avg),
            threshold: 5000,
            timeRange: '24h',
          },
        ),
      );
    }

    // Check for unusual high error rates
    const errorStats = await this.getMetricStats(MetricGroup.APPLICATION_PERFORMANCE, 'error_rate', timeRange);
    if (errorStats.avg > 0.1) {
      anomalies.push(
        await this.createAlert(
          AlertType.ANOMALY,
          AlertSeverity.MEDIUM,
          'High Error Rate',
          `Average error rate is ${Math.round(errorStats.avg * 100)}%, which is above the 10% threshold`,
          {
            metric: 'error_rate',
            average: Math.round(errorStats.avg * 100),
            threshold: 10,
            timeRange: '24h',
          },
        ),
      );
    }

    return anomalies;
  }

  // Runbooks
  async getRunbooks(): Promise<any[]> {
    return [
      {
        id: 'system-outage',
        title: 'System Outage',
        category: 'critical',
        description: 'Response plan for complete system outage',
        steps: [
          'Check system status dashboard',
          'Verify database connectivity',
          'Check API service availability',
          'Identify root cause',
          'Implement temporary fix',
          'Notify affected users',
          'Deploy permanent fix',
          'Update documentation',
        ],
        escalations: ['DevOps Team', 'Engineering Manager'],
      },
      {
        id: 'high-cost',
        title: 'High Cost Alert',
        category: 'cost',
        description: 'Response plan for cost control triggers',
        steps: [
          'Review cost control metrics',
          'Identify which cost control was triggered',
          'Check usage patterns',
          'Implement immediate cost-saving measures',
          'Analyze root cause',
          'Adjust cost control settings',
          'Document the incident',
        ],
        escalations: ['Finance Team', 'Engineering Team'],
      },
      {
        id: 'security-breach',
        title: 'Security Breach',
        category: 'security',
        description: 'Response plan for security incidents',
        steps: [
          'Isolate affected systems',
          'Contain the breach',
          'Identify the attack vector',
          'Remove malicious code',
          'Restore system functionality',
          'Notify affected parties',
          'Update security measures',
          'Conduct post-incident review',
        ],
        escalations: ['Security Team', 'Executive Management'],
      },
    ];
  }

  // Validation
  async getValidationPlaybooks(): Promise<any[]> {
    return [
      {
        id: 'monitoring-validation',
        title: 'Monitoring System Validation',
        description: 'Validation steps for monitoring and alerting',
        checklists: [
          {
            name: 'Metrics Collection',
            items: [
              'User activity metrics are being collected',
              'Application performance metrics are being tracked',
              'Job ingestion metrics are recorded',
              'Matching quality metrics are calculated',
              'Cost tracking metrics are measured',
            ],
          },
          {
            name: 'Alerting System',
            items: [
              'Threshold-based alerts are triggered correctly',
              'Anomaly detection is working',
              'Notifications are sent to appropriate channels',
              'Alert severity levels are configured',
              'Alert status transitions are tracked',
            ],
          },
          {
            name: 'Cost Controls',
            items: [
              'LLM call limits are enforced',
              'API rate limiting is working',
              'Budget monitoring is active',
              'Cost control alerts are triggered',
              'Cost control actions are executed',
            ],
          },
          {
            name: 'Logging System',
            items: [
              'Structured logging is implemented',
              'Request tracing is available',
              'Error tracking is working',
              'Log levels are properly configured',
              'Log entries include relevant metadata',
            ],
          },
        ],
      },
    ];
  }
}
