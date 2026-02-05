import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

interface CompensationAction {
  type: string;
  config: Record<string, any>;
  order: number;
}

interface ErrorContext {
  executionId: string;
  nodeId: string;
  error: Error;
  state: Record<string, any>;
}

@Injectable()
export class ErrorHandlingService {
  private readonly logger = new Logger(ErrorHandlingService.name);
  private readonly MANUAL_INTERVENTION_QUEUE: string[] = [];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handle an error in workflow execution
   */
  async handleError(
    executionId: string,
    nodeId: string,
    error: Error,
    config?: {
      retryEnabled?: boolean;
      retryCount?: number;
      compensationActions?: CompensationAction[];
    },
  ): Promise<{ handled: boolean; action: string; nextRetryAt?: Date }> {
    const retryEnabled = config?.retryEnabled || false;
    const retryCount = config?.retryCount || 0;

    // Check if we should retry
    if (retryEnabled && retryCount < 10) {
      const nextRetryAt = this.calculateNextRetry(retryCount);
      
      await this.logError(executionId, nodeId, error, 'RETRY_PENDING');

      return {
        handled: true,
        action: 'retry',
        nextRetryAt,
      };
    }

    // Check if we have compensation actions
    if (config?.compensationActions && config.compensationActions.length > 0) {
      await this.executeCompensationActions(executionId, config.compensationActions);
      
      await this.logError(executionId, nodeId, error, 'COMPENSATED');

      return { handled: true, action: 'compensated' };
    }

    // Send to manual intervention queue
    await this.addToManualIntervention(executionId, nodeId, error);

    await this.logError(executionId, nodeId, error, 'MANUAL_INTERVENTION');

    return { handled: true, action: 'manual_intervention' };
  }

  /**
   * Execute compensation/rollback actions
   */
  async executeCompensationActions(
    executionId: string,
    actions: CompensationAction[],
  ): Promise<void> {
    // Sort by order
    const sortedActions = [...actions].sort((a, b) => a.order - b.order);

    // Execute in reverse order (rollback)
    for (const action of sortedActions.reverse()) {
      try {
        await this.executeCompensationAction(action, executionId);
      } catch (compError) {
        this.logger.error(`Compensation action failed: ${compError.message}`);
        // Log but continue with other compensation actions
      }
    }
  }

  /**
   * Execute a single compensation action
   */
  private async executeCompensationAction(
    action: CompensationAction,
    executionId: string,
  ): Promise<void> {
    this.logger.log(`Executing compensation action: ${action.type}`);

    switch (action.type) {
      case 'http_revert':
        await this.compensateHttp(action.config, executionId);
        break;
      case 'database_rollback':
        await this.compensateDatabase(action.config, executionId);
        break;
      case 'email_revert':
        await this.compensateEmail(action.config, executionId);
        break;
      case 'api_call':
        await this.compensateApiCall(action.config, executionId);
        break;
      default:
        this.logger.warn(`Unknown compensation action type: ${action.type}`);
    }
  }

  /**
   * Compensate HTTP action
   */
  private async compensateHttp(
    config: Record<string, any>,
    executionId: string,
  ): Promise<void> {
    // Revert HTTP request (e.g., DELETE instead of POST)
    const { method, endpoint, revertData } = config;
    
    this.logger.log(`HTTP compensation: ${method} ${endpoint}`);
  }

  /**
   * Compensate database action
   */
  private async compensateDatabase(
    config: Record<string, any>,
    executionId: string,
  ): Promise<void> {
    // Rollback database operation
    const { operation, table, data, originalData } = config;
    
    this.logger.log(`Database compensation: ${operation} on ${table}`);
  }

  /**
   * Compensate email action
   */
  private async compensateEmail(
    config: Record<string, any>,
    executionId: string,
  ): Promise<void> {
    // Send follow-up email
    const { originalTo, originalSubject, revertMessage } = config;
    
    this.logger.log(`Email compensation to: ${originalTo}`);
  }

  /**
   * Compensate API call
   */
  private async compensateApiCall(
    config: Record<string, any>,
    executionId: string,
  ): Promise<void> {
    // Call revert endpoint
    const { originalEndpoint, revertMethod, revertPayload } = config;
    
    this.logger.log(`API compensation: ${revertMethod} ${originalEndpoint}`);
  }

  /**
   * Add error to manual intervention queue
   */
  async addToManualIntervention(
    executionId: string,
    nodeId: string,
    error: Error,
  ): Promise<void> {
    const interventionId = uuidv4();

    await this.prisma.workflowDeadLetter.create({
      data: {
        executionId,
        workflowId: '',
        nodeId,
        error: {
          message: error.message,
          stack: error.stack,
          code: 'MANUAL_INTERVENTION',
        } as any,
        input: {},
        status: 'PENDING',
        retryCount: 0,
      },
    });

    this.MANUAL_INTERVENTION_QUEUE.push(interventionId);
  }

  /**
   * Get items from manual intervention queue
   */
  async getManualInterventionItems(): Promise<any[]> {
    return this.prisma.workflowDeadLetter.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: { failedAt: 'asc' },
    });
  }

  /**
   * Resolve a manual intervention item
   */
  async resolveManualIntervention(
    itemId: string,
    resolution: string,
    resolvedBy: string,
  ): Promise<void> {
    await this.prisma.workflowDeadLetter.update({
      where: { id: itemId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy,
        resolution,
      },
    });
  }

  /**
   * Retry a failed execution
   */
  async retryFromPoint(
    executionId: string,
    nodeId: string,
  ): Promise<any> {
    const execution = await this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
    });

    if (!execution) {
      throw new NotFoundException('Execution not found');
    }

    const nodes = execution.nodes as any;
    const nodeStates = nodes || {};

    // Reset node state from the given node
    if (nodeStates[nodeId]) {
      nodeStates[nodeId].status = 'PENDING';
      nodeStates[nodeId].attempts = (nodeStates[nodeId].attempts || 0) + 1;
    }

    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: 'RUNNING',
        nodes: nodeStates as any,
      },
    });

    return { executionId, nodeId, retried: true };
  }

  /**
   * Skip a failed node
   */
  async skipNode(executionId: string, nodeId: string): Promise<void> {
    const execution = await this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
    });

    if (!execution) {
      throw new NotFoundException('Execution not found');
    }

    const nodes = execution.nodes as any;
    
    if (nodes[nodeId]) {
      nodes[nodeId].status = 'SKIPPED';
      nodes[nodeId].skippedAt = new Date().toISOString();
    }

    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: { nodes: nodes as any },
    });
  }

  /**
   * Get error statistics
   */
  async getErrorStatistics(
    tenantId: string,
    options?: { fromDate?: Date; toDate?: Date },
  ): Promise<{
    totalErrors: number;
    errorsByNode: Record<string, number>;
    errorsByType: Record<string, number>;
    resolutionRate: number;
  }> {
    const where: any = {
      workflow: { tenantId },
      status: 'FAILED',
    };

    if (options?.fromDate || options?.toDate) {
      where.startedAt = {};
      if (options.fromDate) where.startedAt.gte = options.fromDate;
      if (options.toDate) where.startedAt.lte = options.toDate;
    }

    const failedExecutions = await this.prisma.workflowExecution.findMany({
      where,
    });

    const errorsByNode: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};
    let resolvedErrors = 0;

    for (const execution of failedExecutions) {
      const nodes = execution.nodes as any;
      
      for (const [nodeId, nodeState] of Object.entries(nodes || {})) {
        const state = nodeState as any;
        if (state.status === 'FAILED') {
          errorsByNode[nodeId] = (errorsByNode[nodeId] || 0) + 1;
          
          const errorCode = state.error?.code || 'UNKNOWN';
          errorsByType[errorCode] = (errorsByType[errorCode] || 0) + 1;
        }
      }
    }

    const dlqItems = await this.prisma.workflowDeadLetter.findMany({
      where: {
        status: { in: ['RESOLVED', 'IGNORED'] },
      },
    });

    resolvedErrors = dlqItems.length;

    return {
      totalErrors: failedExecutions.length,
      errorsByNode,
      errorsByType,
      resolutionRate: failedExecutions.length > 0
        ? resolvedErrors / failedExecutions.length
        : 0,
    };
  }

  /**
   * Create error notification
   */
  async createErrorNotification(
    executionId: string,
    error: Error,
    channels: string[],
  ): Promise<void> {
    const notification = {
      type: 'WORKFLOW_ERROR',
      executionId,
      message: error.message,
      timestamp: new Date().toISOString(),
      channels,
    };

    // Send to configured notification channels
    this.logger.log(`Error notification: ${JSON.stringify(notification)}`);
  }

  // ============ PRIVATE METHODS ============

  private calculateNextRetry(attemptCount: number): Date {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc., max 5 minutes
    const delay = Math.min(1000 * Math.pow(2, attemptCount), 300000);
    return new Date(Date.now() + delay);
  }

  private async logError(
    executionId: string,
    nodeId: string,
    error: Error,
    status: string,
  ): Promise<void> {
    await this.prisma.workflowExecutionLog.create({
      data: {
        executionId,
        nodeId,
        level: 'ERROR',
        message: error.message,
        data: {
          stack: error.stack,
          status,
        } as any,
      },
    });
  }
}
