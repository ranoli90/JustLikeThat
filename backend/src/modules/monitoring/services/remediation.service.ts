import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

export interface RemediationAction {
  id?: string;
  name: string;
  description?: string;
  triggerType: 'alert' | 'metric' | 'manual';
  condition: {
    metricName?: string;
    threshold?: number;
    operator?: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq';
    duration?: number;
    alertName?: string;
  };
  action: {
    type: 'scale' | 'restart' | 'rollback' | 'notify' | 'circuit_breaker' | 'custom';
    target?: string;
    value?: number;
    message?: string;
    script?: string;
  };
  isActive?: boolean;
  cooldown?: number;
  requireApproval?: boolean;
}

export interface RemediationExecution {
  id?: string;
  actionId: string;
  triggerType: string;
  triggerId?: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  result?: Record<string, any>;
  error?: string;
}

@Injectable()
export class RemediationService {
  private readonly logger = new Logger(RemediationService.name);
  private readonly predefinedActions = new Map<string, RemediationAction>();

  constructor(private readonly prisma: PrismaService) {
    this.initializePredefinedActions();
  }

  /**
   * Initialize predefined remediation actions
   */
  private initializePredefinedActions(): void {
    // High CPU remediation
    this.predefinedActions.set('high-cpu', {
      name: 'Scale up on high CPU',
      description: 'Automatically scale up when CPU usage exceeds 80%',
      triggerType: 'metric',
      condition: {
        metricName: 'cpu_usage_percent',
        threshold: 80,
        operator: 'gt',
        duration: 300, // 5 minutes
      },
      action: {
        type: 'scale',
        target: 'replicas',
        value: 2,
      },
      cooldown: 600,
      requireApproval: false,
    });

    // High memory remediation
    this.predefinedActions.set('high-memory', {
      name: 'Scale up on high memory',
      description: 'Automatically scale up when memory usage exceeds 85%',
      triggerType: 'metric',
      condition: {
        metricName: 'memory_usage_percent',
        threshold: 85,
        operator: 'gt',
        duration: 300,
      },
      action: {
        type: 'scale',
        target: 'replicas',
        value: 2,
      },
      cooldown: 600,
      requireApproval: false,
    });

    // High error rate remediation
    this.predefinedActions.set('high-error-rate', {
      name: 'Circuit breaker on high errors',
      description: 'Enable circuit breaker when error rate exceeds 5%',
      triggerType: 'metric',
      condition: {
        metricName: 'error_rate',
        threshold: 5,
        operator: 'gt',
        duration: 60,
      },
      action: {
        type: 'circuit_breaker',
        target: 'service',
      },
      cooldown: 300,
      requireApproval: false,
    });

    // Service restart on crash
    this.predefinedActions.set('service-crash', {
      name: 'Restart crashed service',
      description: 'Automatically restart service when it crashes',
      triggerType: 'alert',
      condition: {
        alertName: 'service_down',
      },
      action: {
        type: 'restart',
        target: 'pod',
      },
      cooldown: 60,
      requireApproval: false,
    });

    // Database connection pool
    this.predefinedActions.set('db-connection', {
      name: 'Scale database on connection issues',
      description: 'Increase connection pool when connections are exhausted',
      triggerType: 'metric',
      condition: {
        metricName: 'db_connections_active',
        threshold: 100,
        operator: 'gte',
        duration: 120,
      },
      action: {
        type: 'scale',
        target: 'db_connections',
        value: 50,
      },
      cooldown: 900,
      requireApproval: true,
    });
  }

  /**
   * Create a remediation action
   */
  async createAction(action: RemediationAction): Promise<string> {
    const id = uuidv4();

    await this.prisma.remediationAction.create({
      data: {
        id,
        name: action.name,
        description: action.description,
        triggerType: action.triggerType,
        condition: action.condition as any,
        action: action.action as any,
        isActive: action.isActive ?? true,
        cooldown: action.cooldown ?? 300,
        requireApproval: action.requireApproval ?? false,
      },
    });

    this.logger.log(`Created remediation action: ${action.name}`);
    return id;
  }

  /**
   * Get all remediation actions
   */
  async getActions(): Promise<any[]> {
    return this.prisma.remediationAction.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get predefined actions
   */
  getPredefinedActions(): RemediationAction[] {
    return Array.from(this.predefinedActions.values());
  }

  /**
   * Update remediation action
   */
  async updateAction(id: string, updates: Partial<RemediationAction>): Promise<void> {
    await this.prisma.remediationAction.update({
      where: { id },
      data: {
        ...updates,
        condition: updates.condition as any,
        action: updates.action as any,
      },
    });
  }

  /**
   * Delete remediation action
   */
  async deleteAction(id: string): Promise<void> {
    await this.prisma.remediationAction.delete({
      where: { id },
    });
  }

  /**
   * Execute a remediation action
   */
  async executeAction(
    actionId: string,
    triggerType: string,
    triggerId?: string
  ): Promise<string> {
    const action = await this.prisma.remediationAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new Error(`Remediation action not found: ${actionId}`);
    }

    if (!action.isActive) {
      throw new Error(`Remediation action is inactive: ${actionId}`);
    }

    // Check cooldown
    if (action.lastTriggered) {
      const cooldownEnd = new Date(
        action.lastTriggered.getTime() + (action.cooldown || 300) * 1000
      );
      if (cooldownEnd > new Date()) {
        throw new Error(`Remediation action is in cooldown`);
      }
    }

    const executionId = uuidv4();

    // Create execution record
    await this.prisma.remediationExecution.create({
      data: {
        id: executionId,
        actionId,
        triggerType,
        triggerId,
        status: 'running',
        startedAt: new Date(),
      },
    });

    // Execute the action
    try {
      const result = await this.performAction(action.action as any);

      // Update execution record
      await this.prisma.remediationExecution.update({
        where: { id: executionId },
        data: {
          status: 'succeeded',
          completedAt: new Date(),
          result: result as any,
        },
      });

      // Update action success count
      await this.prisma.remediationAction.update({
        where: { id: actionId },
        data: {
          lastTriggered: new Date(),
          successCount: { increment: 1 },
        },
      });

      this.logger.log(`Remediation action ${action.name} executed successfully`);
      return executionId;
    } catch (error) {
      // Update execution record with error
      await this.prisma.remediationExecution.update({
        where: { id: executionId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: error.message,
        },
      });

      // Update action failure count
      await this.prisma.remediationAction.update({
        where: { id: actionId },
        data: {
          failureCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  /**
   * Perform the actual remediation action
   */
  private async performAction(action: any): Promise<Record<string, any>> {
    switch (action.type) {
      case 'scale':
        return this.performScaleAction(action);
      case 'restart':
        return this.performRestartAction(action);
      case 'rollback':
        return this.performRollbackAction(action);
      case 'circuit_breaker':
        return this.performCircuitBreakerAction(action);
      case 'notify':
        return this.performNotifyAction(action);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Scale action implementation
   */
  private async performScaleAction(action: any): Promise<Record<string, any>> {
    // In production, this would call Kubernetes API or cloud provider
    this.logger.log(`Scaling ${action.target} to ${action.value}`);
    return {
      type: 'scale',
      target: action.target,
      value: action.value,
      message: `Scaled ${action.target} to ${action.value}`,
    };
  }

  /**
   * Restart action implementation
   */
  private async performRestartAction(action: any): Promise<Record<string, any>> {
    this.logger.log(`Restarting ${action.target}`);
    return {
      type: 'restart',
      target: action.target,
      message: `Restarted ${action.target}`,
    };
  }

  /**
   * Rollback action implementation
   */
  private async performRollbackAction(action: any): Promise<Record<string, any>> {
    this.logger.log(`Rolling back ${action.target}`);
    return {
      type: 'rollback',
      target: action.target,
      message: `Rolled back ${action.target}`,
    };
  }

  /**
   * Circuit breaker action implementation
   */
  private async performCircuitBreakerAction(action: any): Promise<Record<string, any>> {
    this.logger.log(`Enabling circuit breaker for ${action.target}`);
    return {
      type: 'circuit_breaker',
      target: action.target,
      message: `Circuit breaker enabled for ${action.target}`,
    };
  }

  /**
   * Notify action implementation
   */
  private async performNotifyAction(action: any): Promise<Record<string, any>> {
    this.logger.log(`Sending notification: ${action.message}`);
    return {
      type: 'notify',
      message: action.message,
      sent: true,
    };
  }

  /**
   * Get execution status
   */
  async getExecution(executionId: string): Promise<any> {
    return this.prisma.remediationExecution.findUnique({
      where: { id: executionId },
    });
  }

  /**
   * Get executions for an action
   */
  async getActionExecutions(actionId: string): Promise<any[]> {
    return this.prisma.remediationExecution.findMany({
      where: { actionId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Get remediation statistics
   */
  async getRemediationStats(): Promise<{
    totalActions: number;
    activeActions: number;
    totalExecutions: number;
    successRate: number;
    avgExecutionTime: number;
  }> {
    const [totalActions, activeActions, executions] = await Promise.all([
      this.prisma.remediationAction.count(),
      this.prisma.remediationAction.count({ where: { isActive: true } }),
      this.prisma.remediationExecution.findMany(),
    ]);

    const successful = executions.filter(e => e.status === 'succeeded').length;
    const failed = executions.filter(e => e.status === 'failed').length;
    const total = successful + failed;

    const successRate = total > 0 ? (successful / total) * 100 : 0;

    // Calculate average execution time
    const completedExecutions = executions.filter(
      e => e.completedAt && e.status !== 'pending'
    );
    const avgExecutionTime =
      completedExecutions.length > 0
        ? completedExecutions.reduce((sum, e) => {
            const duration = e.completedAt!.getTime() - e.startedAt.getTime();
            return sum + duration;
          }, 0) /
          (completedExecutions.length * 1000)
        : 0;

    return {
      totalActions,
      activeActions,
      totalExecutions: executions.length,
      successRate,
      avgExecutionTime,
    };
  }

  /**
   * Check conditions and trigger auto-remediation
   */
  async checkAndTriggerRemediations(
    metricName: string,
    value: number,
    labels: Record<string, string>
  ): Promise<string[]> {
    const triggeredActions: string[] = [];

    const actions = await this.prisma.remediationAction.findMany({
      where: {
        isActive: true,
        triggerType: 'metric',
      },
    });

    for (const action of actions) {
      const condition = action.condition as any;

      if (condition.metricName !== metricName) continue;

      let conditionMet = false;
      switch (condition.operator) {
        case 'gt':
          conditionMet = value > condition.threshold;
          break;
        case 'lt':
          conditionMet = value < condition.threshold;
          break;
        case 'gte':
          conditionMet = value >= condition.threshold;
          break;
        case 'lte':
          conditionMet = value <= condition.threshold;
          break;
        case 'eq':
          conditionMet = value === condition.threshold;
          break;
        case 'neq':
          conditionMet = value !== condition.threshold;
          break;
      }

      if (conditionMet) {
        try {
          await this.executeAction(action.id, 'metric');
          triggeredActions.push(action.id);
        } catch (error) {
          this.logger.error(`Failed to execute remediation action: ${error.message}`);
        }
      }
    }

    return triggeredActions;
  }
}
