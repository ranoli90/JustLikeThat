import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

interface WebhookPayload {
  headers: Record<string, string>;
  body: any;
  query: Record<string, string>;
  method: string;
  ip: string;
}

interface CronJob {
  id: string;
  cronExpression: string;
  timezone: string;
  nextRun: Date;
  callback: () => Promise<void>;
}

@Injectable()
export class TriggerService {
  private readonly logger = new Logger(TriggerService.name);
  private readonly WEBHOOK_CONCURRENT_LIMIT = 1000;
  private readonly EVENT_PROCESSING_TIMEOUT = 100;
  private readonly HMAC_TIMESTAMP_MAX_AGE = 300000; // 5 minutes for replay attack prevention
  
  // In-memory cron job storage (use Redis in production)
  private cronJobs: Map<string, CronJob> = new Map();
  private cronIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(private readonly prisma: PrismaService) {
    // Start cron job scheduler
    this.startCronScheduler();
  }

  // ============ WEBHOOK TRIGGERS ============

  /**
   * Create a webhook trigger for a workflow
   */
  async createWebhookTrigger(
    workflowId: string,
    config: {
      webhookPath?: string;
      webhookSecret?: string;
      authType?: string;
    },
    tenantId: string,
  ): Promise<{ webhookId: string; webhookPath: string }> {
    const webhookId = uuidv4();
    const webhookPath = `/api/v1/webhooks/${webhookId}`;

    await this.prisma.workflowTrigger.create({
      data: {
        workflowId,
        triggerType: 'WEBHOOK',
        config: {
          webhookPath,
          webhookSecret: config.webhookSecret,
          authType: config.authType || 'none',
        } as any,
        webhookPath,
        webhookSecret: config.webhookSecret,
        tenantId,
      },
    });

    return { webhookId, webhookPath };
  }

  /**
   * Handle incoming webhook request
   */
  async handleWebhook(
    webhookId: string,
    payload: WebhookPayload,
    tenantId: string,
  ): Promise<{ valid: boolean; error?: string; executionId?: string }> {
    // Get webhook trigger
    const trigger = await this.prisma.workflowTrigger.findFirst({
      where: {
        id: webhookId,
        triggerType: 'WEBHOOK',
        isActive: true,
      },
      include: {
        workflow: true,
      },
    });

    if (!trigger) {
      return { valid: false, error: 'Webhook not found or inactive' };
    }

    // Validate webhook secret if configured
    if (trigger.webhookSecret) {
      const signature = payload.headers['x-webhook-signature'];
      if (!this.validateWebhookSignature(payload, trigger.webhookSecret, signature)) {
        return { valid: false, error: 'Invalid webhook signature' };
      }
    }

    // Validate content type
    const contentType = payload.headers['content-type'] || '';
    if (!contentType.includes('application/json') && !contentType.includes('application/x-www-form-urlencoded')) {
      return { valid: false, error: 'Unsupported content type' };
    }

    // Update trigger stats
    await this.prisma.workflowTrigger.update({
      where: { id: webhookId },
      data: {
        totalTriggers: { increment: 1 },
        lastTriggeredAt: new Date(),
      },
    });

    // Execute workflow
    const config = trigger.config as any;
    const execution = await this.executeWorkflow(
      trigger.workflowId,
      {
        input: {
          ...payload.body,
          _webhook: {
            headers: payload.headers,
            query: payload.query,
            method: payload.method,
            ip: payload.ip,
            timestamp: new Date().toISOString(),
          },
        },
        trigger: 'WEBHOOK',
      },
      tenantId,
    );

    return { valid: true, executionId: execution.executionId };
  }

  /**
   * Validate webhook signature with timestamp-based replay attack prevention
   */
  private validateWebhookSignature(
    payload: WebhookPayload,
    secret: string,
    signature?: string,
  ): boolean {
    if (!signature) return false;

    // Parse signature format: t=timestamp,v1=signature
    const parts = signature.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));
    
    if (!timestampPart || !signaturePart) {
      // Fallback for old signature format
      const expectedSignature = this.generateHmacSignature(
        JSON.stringify(payload.body),
        secret,
      );
      return signature === expectedSignature || signature === `sha256=${expectedSignature}`;
    }

    const timestamp = parseInt(timestampPart.substring(2));
    const providedSignature = signaturePart.substring(3);
    
    // Check timestamp to prevent replay attacks
    if (Date.now() - timestamp > this.HMAC_TIMESTAMP_MAX_AGE) {
      this.logger.warn('Webhook signature timestamp too old, potential replay attack');
      return false;
    }

    // Calculate expected signature with timestamp
    const signedPayload = `${timestamp}.${JSON.stringify(payload.body)}`;
    const expectedSignature = this.generateHmacSignature(signedPayload, secret);
    
    // Use timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(providedSignature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Generate HMAC-SHA256 signature
   */
  private generateHmacSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Generate webhook signature with timestamp
   */
  generateWebhookSignature(payload: string, secret: string): string {
    const timestamp = Date.now();
    const signedPayload = `${timestamp}.${payload}`;
    const signature = this.generateHmacSignature(signedPayload, secret);
    return `t=${timestamp},v1=${signature}`;
  }

  // ============ SCHEDULE TRIGGERS ============

  /**
   * Create a schedule trigger for a workflow
   */
  async createScheduleTrigger(
    workflowId: string,
    config: {
      cronExpression: string;
      timezone?: string;
      priority?: number;
    },
    tenantId: string,
    userId: string,
  ): Promise<any> {
    const nextRun = this.calculateNextRun(config.cronExpression, config.timezone || 'UTC');

    const schedule = await this.prisma.scheduledWorkflow.create({
      data: {
        workflowId,
        cronExpression: config.cronExpression,
        timezone: config.timezone || 'UTC',
        nextRun,
        priority: config.priority || 5,
        tenantId,
        createdBy: userId,
        status: 'ACTIVE',
      },
    });

    // Register cron job
    this.registerCronJob(
      schedule.id,
      config.cronExpression,
      config.timezone || 'UTC',
      () => this.handleScheduledExecution(schedule.id),
    );

    return schedule;
  }

  /**
   * Handle scheduled execution
   */
  private async handleScheduledExecution(scheduleId: string): Promise<void> {
    const schedule = await this.prisma.scheduledWorkflow.findUnique({
      where: { id: scheduleId },
      include: { workflow: true },
    });

    if (!schedule || schedule.status !== 'ACTIVE') {
      return;
    }

    try {
      // Execute workflow
      await this.executeWorkflow(
        schedule.workflowId,
        {
          input: { _scheduleId: scheduleId },
          trigger: 'SCHEDULE',
        },
        schedule.tenantId,
      );

      // Update schedule stats
      await this.prisma.scheduledWorkflow.update({
        where: { id: scheduleId },
        data: {
          lastRun: new Date(),
          totalRuns: { increment: 1 },
          nextRun: this.calculateNextRun(schedule.cronExpression, schedule.timezone),
        },
      });
    } catch (error) {
      this.logger.error(`Scheduled execution failed: ${error.message}`);

      await this.prisma.scheduledWorkflow.update({
        where: { id: scheduleId },
        data: {
          failedRuns: { increment: 1 },
          status: 'FAILED',
        },
      });
    }
  }

  /**
   * Calculate next run time from cron expression
   */
  private calculateNextRun(cronExpression: string, timezone: string): Date {
    // Simplified cron parser (use cron-parser library in production)
    // Format: minute hour day month day-of-week
    const parts = cronExpression.split(' ');
    
    if (parts.length !== 5) {
      throw new BadRequestException('Invalid cron expression');
    }

    const now = new Date();
    const [minute, hour, day, month, dow] = parts;

    // Calculate next run (simplified)
    const next = new Date(now);
    next.setMinutes(next.getMinutes() + 1);
    next.setSeconds(0);
    next.setMilliseconds(0);

    return next;
  }

  /**
   * Start the cron job scheduler
   */
  private startCronScheduler(): void {
    // Check for due cron jobs every second
    setInterval(async () => {
      const now = new Date();
      
      for (const [scheduleId, job] of this.cronJobs.entries()) {
        if (job.nextRun <= now) {
          try {
            await job.callback();
          } catch (error) {
            this.logger.error(`Cron job ${scheduleId} failed: ${error.message}`);
          }
        }
      }
    }, 1000);
  }

  /**
   * Register a cron job
   */
  private registerCronJob(
    scheduleId: string,
    cronExpression: string,
    timezone: string,
    callback: () => Promise<void>,
  ): void {
    const nextRun = this.calculateNextRun(cronExpression, timezone);
    
    this.cronJobs.set(scheduleId, {
      id: scheduleId,
      cronExpression,
      timezone,
      nextRun,
      callback,
    });
  }

  // ============ EVENT TRIGGERS ============

  /**
   * Create an event trigger for a workflow
   */
  async createEventTrigger(
    workflowId: string,
    config: {
      eventType: string;
      eventFilter?: Record<string, any>;
    },
    tenantId: string,
  ): Promise<string> {
    const trigger = await this.prisma.workflowTrigger.create({
      data: {
        workflowId,
        triggerType: 'EVENT',
        config: config as any,
        tenantId,
      },
    });

    return trigger.id;
  }

  /**
   * Handle incoming event
   */
  async handleEvent(
    eventType: string,
    payload: Record<string, any>,
    tenantId: string,
  ): Promise<{ processed: number; executionIds: string[] }> {
    const executionIds: string[] = [];

    // Find all active event triggers for this event type
    const triggers = await this.prisma.workflowTrigger.findMany({
      where: {
        triggerType: 'EVENT',
        isActive: true,
        tenantId,
        config: {
          path: ['eventType'],
          equals: eventType,
        },
      },
    });

    for (const trigger of triggers) {
      const config = trigger.config as any;

      // Check if event passes filter
      if (config.eventFilter && !this.matchEventFilter(payload, config.eventFilter)) {
        continue;
      }

      // Execute workflow
      const execution = await this.executeWorkflow(
        trigger.workflowId,
        {
          input: {
            ...payload,
            _eventType: eventType,
            _eventTimestamp: new Date().toISOString(),
          },
          trigger: 'EVENT',
        },
        tenantId,
      );

      executionIds.push(execution.executionId);
    }

    return { processed: triggers.length, executionIds };
  }

  /**
   * Match event against filter
   */
  private matchEventFilter(
    event: Record<string, any>,
    filter: Record<string, any>,
  ): boolean {
    for (const [key, expectedValue] of Object.entries(filter)) {
      const eventValue = this.getValueByPath(event, key);
      
      if (typeof expectedValue === 'object' && expectedValue !== null) {
        // Complex filter with operators
        if (expectedValue.exists !== undefined) {
          const exists = eventValue !== undefined;
          if (exists !== expectedValue.exists) return false;
        }
        if (expectedValue.eq !== undefined && eventValue !== expectedValue.eq) return false;
        if (expectedValue.in !== undefined && !expectedValue.in.includes(eventValue)) return false;
      } else {
        if (eventValue !== expectedValue) return false;
      }
    }

    return true;
  }

  // ============ API TRIGGERS ============

  /**
   * Create an API trigger for a workflow
   */
  async createApiTrigger(
    workflowId: string,
    config: {
      authType: string;
      authConfig?: Record<string, any>;
    },
    tenantId: string,
  ): Promise<{ triggerId: string; apiKey?: string }> {
    const apiKey = config.authType === 'apikey' ? this.generateApiKey() : undefined;

    const trigger = await this.prisma.workflowTrigger.create({
      data: {
        workflowId,
        triggerType: 'API',
        config: {
          ...config,
          apiKey: apiKey ? await this.hashApiKey(apiKey) : undefined,
        } as any,
        tenantId,
      },
    });

    return { triggerId: trigger.id, apiKey };
  }

  /**
   * Handle API trigger request
   */
  async handleApiTrigger(
    triggerId: string,
    payload: Record<string, any>,
    auth: { type: string; credentials: Record<string, string> },
    tenantId: string,
  ): Promise<{ valid: boolean; error?: string; executionId?: string }> {
    const trigger = await this.prisma.workflowTrigger.findFirst({
      where: { id: triggerId, triggerType: 'API', isActive: true },
    });

    if (!trigger) {
      return { valid: false, error: 'API trigger not found' };
    }

    const config = trigger.config as any;

    // Validate authentication
    const authValid = await this.validateApiAuth(auth, config);
    if (!authValid) {
      return { valid: false, error: 'Invalid authentication' };
    }

    // Execute workflow
    const execution = await this.executeWorkflow(
      trigger.workflowId,
      {
        input: { ...payload, _apiTrigger: true },
        trigger: 'API',
      },
      tenantId,
    );

    return { valid: true, executionId: execution.executionId };
  }

  /**
   * Validate API authentication
   */
  private async validateApiAuth(
    auth: { type: string; credentials: Record<string, string> },
    config: Record<string, any>,
  ): Promise<boolean> {
    switch (auth.type) {
      case 'apikey':
        return this.validateApiKey(auth.credentials.apiKey, config.apiKey);

      case 'oauth2':
        return this.validateOAuthToken(auth.credentials.token);

      case 'jwt':
        return this.validateJwtToken(auth.credentials.token, config);

      default:
        return true;
    }
  }

  private validateApiKey(provided: string, stored: string): boolean {
    return provided === stored;
  }

  private async validateOAuthToken(token: string): Promise<boolean> {
    // In production, validate with OAuth provider
    return !!token && token.length > 10;
  }

  private async validateJwtToken(token: string, config: Record<string, any>): Promise<boolean> {
    // In production, validate JWT with proper library
    return !!token && token.split('.').length === 3;
  }

  private generateApiKey(): string {
    return `ak_${uuidv4().replace(/-/g, '')}`;
  }

  private async hashApiKey(apiKey: string): Promise<string> {
    // In production, use proper hashing
    return Buffer.from(apiKey).toString('base64');
  }

  // ============ UTILITY METHODS ============

  /**
   * Execute a workflow from trigger
   */
  private async executeWorkflow(
    workflowId: string,
    dto: { input: Record<string, any>; trigger: string },
    tenantId: string,
  ): Promise<{ executionId: string }> {
    // This would call the WorkflowExecutionService
    // For now, return a mock response
    return { executionId: uuidv4() };
  }

  /**
   * Get value by dot notation path
   */
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Update trigger status
   */
  async updateTriggerStatus(triggerId: string, isActive: boolean): Promise<void> {
    await this.prisma.workflowTrigger.update({
      where: { id: triggerId },
      data: { isActive },
    });
  }

  /**
   * Get all triggers for a workflow
   */
  async getWorkflowTriggers(workflowId: string): Promise<any[]> {
    return this.prisma.workflowTrigger.findMany({
      where: { workflowId },
    });
  }

  /**
   * Delete a trigger
   */
  async deleteTrigger(triggerId: string): Promise<void> {
    await this.prisma.workflowTrigger.delete({
      where: { id: triggerId },
    });
  }
}
