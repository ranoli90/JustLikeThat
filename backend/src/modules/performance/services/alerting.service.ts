import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // Duration in ms before triggering
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  tags: Record<string, string>;
}

interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  currentValue: number;
  threshold: number;
  status: 'firing' | 'resolved' | 'pending';
  startedAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  labels: Record<string, string>;
  annotations: {
    summary: string;
    description: string;
    runbook?: string;
  };
}

interface NotificationChannel {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'pagerduty';
  config: Record<string, any>;
  enabled: boolean;
  filters?: {
    severities?: string[];
    tags?: Record<string, string>;
  };
}

interface AlertStats {
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  firingAlerts: number;
  resolvedAlerts: number;
}

@Injectable()
export class AlertingService extends EventEmitter implements OnModuleInit {
  private readonly logger = new Logger(AlertingService.name);
  private alertRules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private evaluationStates: Map<string, { value: number; startTime: Date }> = new Map();
  private readonly checkInterval: number;

  constructor(private readonly configService: ConfigService) {
    super();
    this.checkInterval = this.configService.get<number>('ALERT_CHECK_INTERVAL', 30000);
  }

  async onModuleInit() {
    this.initializeDefaultRules();
    this.startAlertEvaluation();
    this.logger.log('Alerting service initialized');
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-cpu',
        name: 'High CPU Usage',
        metric: 'system.cpu.usage',
        condition: 'gt',
        threshold: 90,
        duration: 300000,
        severity: 'warning',
        enabled: true,
        tags: {},
      },
      {
        id: 'critical-cpu',
        name: 'Critical CPU Usage',
        metric: 'system.cpu.usage',
        condition: 'gte',
        threshold: 98,
        duration: 60000,
        severity: 'critical',
        enabled: true,
        tags: {},
      },
      {
        id: 'high-memory',
        name: 'High Memory Usage',
        metric: 'system.memory.percentage',
        condition: 'gt',
        threshold: 90,
        duration: 300000,
        severity: 'warning',
        enabled: true,
        tags: {},
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        metric: 'http.errors.rate',
        condition: 'gt',
        threshold: 5,
        duration: 60000,
        severity: 'critical',
        enabled: true,
        tags: {},
      },
      {
        id: 'slow-response',
        name: 'Slow Response Time',
        metric: 'http.requests.duration.p99',
        condition: 'gt',
        threshold: 5000,
        duration: 120000,
        severity: 'warning',
        enabled: true,
        tags: {},
      },
      {
        id: 'low-cache-hit-rate',
        name: 'Low Cache Hit Rate',
        metric: 'cache.hit_rate',
        condition: 'lt',
        threshold: 50,
        duration: 300000,
        severity: 'warning',
        enabled: true,
        tags: {},
      },
    ];

    for (const rule of defaultRules) {
      this.alertRules.set(rule.id, rule);
    }
  }

  /**
   * Start alert evaluation loop
   */
  private startAlertEvaluation(): void {
    setInterval(async () => {
      await this.evaluateAllRules();
    }, this.checkInterval);
  }

  /**
   * Evaluate all enabled alert rules
   */
  private async evaluateAllRules(): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;
      
      await this.evaluateRule(rule);
    }
  }

  /**
   * Evaluate a single alert rule
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    const currentValue = await this.getCurrentMetricValue(rule.metric, rule.tags);
    
    if (currentValue === null) {
      return; // Metric not available
    }

    const shouldAlert = this.checkCondition(currentValue, rule.threshold, rule.condition);
    const key = `${rule.id}:${JSON.stringify(rule.tags)}`;

    if (shouldAlert) {
      // Check if condition has persisted long enough
      if (!this.evaluationStates.has(key)) {
        this.evaluationStates.set(key, { value: currentValue, startTime: new Date() });
        return;
      }

      const state = this.evaluationStates.get(key)!;
      const duration = Date.now() - state.startTime.getTime();

      if (duration >= rule.duration) {
        // Create or update alert
        await this.createOrUpdateAlert(rule, currentValue);
      }
    } else {
      // Condition not met, clear evaluation state
      this.evaluationStates.delete(key);
      
      // Resolve existing alert if any
      await this.resolveAlert(rule.id);
    }
  }

  /**
   * Check if condition is met
   */
  private checkCondition(value: number, threshold: number, condition: string): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  /**
   * Get current metric value
   */
  private async getCurrentMetricValue(metric: string, tags: Record<string, string>): Promise<number | null> {
    // In a real implementation, this would query the metrics service
    // For now, we'll simulate based on the metric name
    switch (metric) {
      case 'system.cpu.usage':
        return Math.random() * 100;
      case 'system.memory.percentage':
        return Math.random() * 100;
      case 'http.errors.rate':
        return Math.random() * 10;
      case 'http.requests.duration.p99':
        return Math.random() * 5000;
      case 'cache.hit_rate':
        return Math.random() * 100;
      default:
        return null;
    }
  }

  /**
   * Create or update an alert
   */
  private async createOrUpdateAlert(rule: AlertRule, currentValue: number): Promise<void> {
    const existingAlert = Array.from(this.alerts.values())
      .find(a => a.ruleId === rule.id && a.status === 'firing');

    if (existingAlert) {
      // Update existing alert
      existingAlert.currentValue = currentValue;
      this.logger.debug(`Alert updated: ${rule.name} - Current: ${currentValue}, Threshold: ${rule.threshold}`);
    } else {
      // Create new alert
      const alert = this.createAlert(rule, currentValue);
      this.alerts.set(alert.id, alert);
      
      this.logger.warn(`Alert triggered: ${rule.name} - ${currentValue} ${rule.condition} ${rule.threshold}`);
      
      // Send notifications
      await this.sendNotifications(alert);
      
      this.emit('alert:triggered', alert);
    }
  }

  /**
   * Create an alert object
   */
  private createAlert(rule: AlertRule, currentValue: number): Alert {
    return {
      id: `alert-${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: `${rule.name} is ${currentValue} (threshold: ${rule.threshold})`,
      currentValue,
      threshold: rule.threshold,
      status: 'firing',
      startedAt: new Date(),
      labels: rule.tags,
      annotations: {
        summary: rule.name,
        description: `The metric ${rule.metric} has crossed the threshold of ${rule.threshold}. Current value: ${currentValue}`,
      },
    };
  }

  /**
   * Resolve an alert
   */
  private async resolveAlert(ruleId: string): Promise<void> {
    const alert = Array.from(this.alerts.values())
      .find(a => a.ruleId === ruleId && a.status === 'firing');

    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      
      this.logger.log(`Alert resolved: ${alert.ruleName}`);
      this.emit('alert:resolved', alert);
    }
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    for (const channel of this.notificationChannels.values()) {
      if (!channel.enabled) continue;
      
      // Check filters
      if (channel.filters?.severities && 
          !channel.filters.severities.includes(alert.severity)) {
        continue;
      }

      try {
        await this.sendToChannel(channel, alert);
      } catch (error) {
        this.logger.error(`Failed to send notification via ${channel.id}`, error);
      }
    }
  }

  /**
   * Send alert to notification channel
   */
  private async sendToChannel(channel: NotificationChannel, alert: Alert): Promise<void> {
    switch (channel.type) {
      case 'webhook':
        await this.sendWebhookNotification(channel.config.url, alert);
        break;
      case 'slack':
        await this.sendSlackNotification(channel.config, alert);
        break;
      case 'email':
        await this.sendEmailNotification(channel.config, alert);
        break;
      case 'pagerduty':
        await this.sendPagerDutyNotification(channel.config, alert);
        break;
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(url: string, alert: Alert): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId: alert.id,
        severity: alert.severity,
        message: alert.message,
        currentValue: alert.currentValue,
        threshold: alert.threshold,
        startedAt: alert.startedAt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(config: any, alert: Alert): Promise<void> {
    // Would integrate with Slack API
    this.logger.log(`[Slack] Alert: ${alert.message}`);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(config: any, alert: Alert): Promise<void> {
    // Would integrate with email service
    this.logger.log(`[Email] Alert sent to ${config.to}: ${alert.message}`);
  }

  /**
   * Send PagerDuty notification
   */
  private async sendPagerDutyNotification(config: any, alert: Alert): Promise<void> {
    // Would integrate with PagerDuty API
    this.logger.log(`[PagerDuty] Alert triggered: ${alert.message}`);
  }

  /**
   * Add a notification channel
   */
  addNotificationChannel(channel: NotificationChannel): void {
    this.notificationChannels.set(channel.id, channel);
    this.logger.log(`Notification channel added: ${channel.id} (${channel.type})`);
  }

  /**
   * Add an alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.log(`Alert rule added: ${rule.id}`);
  }

  /**
   * Get alert statistics
   */
  getStats(): AlertStats {
    const alerts = Array.from(this.alerts.values());
    
    return {
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      warningAlerts: alerts.filter(a => a.severity === 'warning').length,
      infoAlerts: alerts.filter(a => a.severity === 'info').length,
      firingAlerts: alerts.filter(a => a.status === 'firing').length,
      resolvedAlerts: alerts.filter(a => a.status === 'resolved').length,
    };
  }

  /**
   * Get all alerts
   */
  getAlerts(status?: 'firing' | 'resolved' | 'pending'): Alert[] {
    const alerts = Array.from(this.alerts.values());
    
    if (status) {
      return alerts.filter(a => a.status === status);
    }
    
    return alerts;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    
    if (alert && alert.status === 'firing') {
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = acknowledgedBy;
      this.emit('alert:acknowledged', alert);
      return true;
    }
    
    return false;
  }

  /**
   * Silence an alert
   */
  silenceAlert(alertId: string, duration: number): boolean {
    const alert = this.alerts.get(alertId);
    
    if (alert && alert.status === 'firing') {
      alert.status = 'resolved';
      this.emit('alert:silenced', alert);
      return true;
    }
    
    return false;
  }

  /**
   * Test notification channel
   */
  async testChannel(channelId: string): Promise<boolean> {
    const channel = this.notificationChannels.get(channelId);
    
    if (!channel) {
      return false;
    }

    const testAlert: Alert = {
      id: 'test-alert',
      ruleId: 'test',
      ruleName: 'Test Alert',
      severity: 'info',
      message: 'This is a test notification',
      currentValue: 0,
      threshold: 0,
      status: 'firing',
      startedAt: new Date(),
      labels: {},
      annotations: {
        summary: 'Test Alert',
        description: 'This is a test notification from the alerting system',
      },
    };

    try {
      await this.sendToChannel(channel, testAlert);
      return true;
    } catch (error) {
      this.logger.error(`Failed to test channel ${channelId}`, error);
      return false;
    }
  }

  /**
   * Get alert rules
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Enable/disable alert rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.alertRules.get(ruleId);
    
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    
    return false;
  }
}
