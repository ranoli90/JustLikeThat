import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

interface ParallelBranch {
  id: string;
  nodeIds: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

interface FanOutRequest {
  executionId: string;
  parentNodeId: string;
  items: any[];
  nodeConfig: {
    batchSize?: number;
    concurrency?: number;
    aggregation?: {
      timeout: number;
      strategy: 'all' | 'first' | 'last';
    };
  };
}

@Injectable()
export class ParallelExecutionService {
  private readonly logger = new Logger(ParallelExecutionService.name);
  private readonly DEFAULT_CONCURRENCY = 10;
  private readonly DEFAULT_BATCH_SIZE = 100;
  private readonly AGGREGATION_TIMEOUT = 300000; // 5 minutes

  // Resource pool for parallel tasks
  private resourcePool: Map<string, { available: number; total: number }> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute branches in parallel
   */
  async executeParallel(
    executionId: string,
    branches: ParallelBranch[],
    config?: {
      timeout?: number;
      concurrency?: number;
      failFast?: boolean;
    },
  ): Promise<{ success: boolean; results: Map<string, any>; errors: Map<string, string> }> {
    const timeout = config?.timeout || this.AGGREGATION_TIMEOUT;
    const concurrency = config?.concurrency || this.DEFAULT_CONCURRENCY;
    const failFast = config?.failFast || false;

    const results = new Map<string, any>();
    const errors = new Map<string, string>();
    let completedCount = 0;

    // Create semaphore for concurrency control
    const semaphore = new Semaphore(concurrency);

    // Start all branches
    const branchPromises = branches.map(async (branch) => {
      await semaphore.acquire();

      try {
        branch.status = 'running';
        branch.startedAt = new Date();

        const result = await this.executeBranch(executionId, branch);

        branch.status = 'completed';
        branch.result = result;
        branch.completedAt = new Date();

        results.set(branch.id, result);
      } catch (error) {
        branch.status = 'failed';
        branch.error = error.message;
        errors.set(branch.id, error.message);

        if (failFast) {
          semaphore.releaseAll();
        }
      } finally {
        completedCount++;
        semaphore.release();
      }
    });

    // Wait for all branches or timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Parallel execution timeout')), timeout);
    });

    try {
      await Promise.race([Promise.all(branchPromises), timeoutPromise]);
    } catch (error) {
      this.logger.warn(`Parallel execution timeout or error: ${error.message}`);
    }

    return {
      success: errors.size === 0,
      results,
      errors,
    };
  }

  /**
   * Execute fan-out/fan-in pattern
   */
  async executeFanOut(
    request: FanOutRequest,
    executeItem: (item: any, index: number) => Promise<any>,
  ): Promise<{ aggregated: any; results: any[]; errors: any[] }> {
    const { items, nodeConfig } = request;
    const batchSize = nodeConfig.batchSize || this.DEFAULT_BATCH_SIZE;
    const concurrency = nodeConfig.concurrency || this.DEFAULT_CONCURRENCY;
    const aggregation = nodeConfig.aggregation;

    const results: any[] = [];
    const errors: any[] = [];
    const allItems = Array.isArray(items) ? items : Object.entries(items);

    // Process in batches
    const batches = this.chunkArray(allItems, batchSize);

    for (const batch of batches) {
      const batchResults = await this.processBatch(batch, executeItem, concurrency);
      
      results.push(...batchResults.results);
      errors.push(...batchResults.errors);

      // Check aggregation timeout
      if (aggregation && results.length >= aggregation.timeout) {
        break;
      }
    }

    // Aggregate results
    const aggregated = this.aggregateResults(results, aggregation?.strategy || 'all');

    return { aggregated, results, errors };
  }

  /**
   * Execute items in parallel with resource allocation
   */
  async executeWithResourceAllocation(
    executionId: string,
    items: { id: string; resource: string }[],
    executeItem: (item: any) => Promise<any>,
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const resourceGroups = new Map<string, any[]>();

    // Group items by resource
    for (const item of items) {
      const group = resourceGroups.get(item.resource) || [];
      group.push(item);
      resourceGroups.set(item.resource, group);
    }

    // Execute each resource group
    for (const [resource, resourceItems] of resourceGroups) {
      const poolInfo = this.resourcePool.get(resource) || { available: 10, total: 10 };
      const concurrency = Math.min(poolInfo.available, resourceItems.length);

      const groupResults = await Promise.all(
        resourceItems.map(async (item, index) => {
          const result = await executeItem(item);
          results.set(item.id, result);
          return result;
        }),
      );
    }

    return results;
  }

  /**
   * Allocate resources for parallel execution
   */
  async allocateResources(
    executionId: string,
    resources: { resource: string; amount: number }[],
  ): Promise<boolean> {
    for (const { resource, amount } of resources) {
      const current = this.resourcePool.get(resource) || { available: 10, total: 10 };

      if (current.available < amount) {
        // Try to scale up
        current.available += amount;
        current.total += amount;
      } else {
        current.available -= amount;
      }

      this.resourcePool.set(resource, current);
    }

    return true;
  }

  /**
   * Release resources after execution
   */
  async releaseResources(
    executionId: string,
    resources: { resource: string; amount: number }[],
  ): Promise<void> {
    for (const { resource, amount } of resources) {
      const current = this.resourcePool.get(resource);

      if (current) {
        current.available += amount;
        if (current.available > current.total) {
          current.available = current.total;
        }
        this.resourcePool.set(resource, current);
      }
    }
  }

  /**
   * Manage parallel execution state
   */
  async getExecutionState(executionId: string): Promise<{
    status: string;
    branches: ParallelBranch[];
    progress: number;
  }> {
    const execution = await this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
    });

    if (!execution) {
      throw new BadRequestException('Execution not found');
    }

    const nodes = execution.nodes as any;
    const branches: ParallelBranch[] = Object.values(nodes || {});

    const completed = branches.filter(b => b.status === 'completed').length;
    const progress = branches.length > 0 ? (completed / branches.length) * 100 : 0;

    return {
      status: execution.status,
      branches,
      progress,
    };
  }

  /**
   * Handle parallel execution errors
   */
  async handleErrors(
    executionId: string,
    errors: Map<string, string>,
    config?: {
      retryFailed?: boolean;
      continueOnError?: boolean;
      fallbackNode?: string;
    },
  ): Promise<{ handled: boolean; action: string }> {
    const retryFailed = config?.retryFailed || false;
    const continueOnError = config?.continueOnError || false;

    if (errors.size === 0) {
      return { handled: true, action: 'none' };
    }

    if (continueOnError) {
      // Log errors and continue
      for (const [branchId, error] of errors) {
        await this.logError(executionId, branchId, error);
      }
      return { handled: true, action: 'continued' };
    }

    if (retryFailed) {
      // Retry failed branches
      return { handled: true, action: 'retrying' };
    }

    if (config?.fallbackNode) {
      // Execute fallback node
      return { handled: true, action: 'fallback' };
    }

    // Fail the execution
    return { handled: false, action: 'failed' };
  }

  // ============ PRIVATE METHODS ============

  private async executeBranch(executionId: string, branch: ParallelBranch): Promise<any> {
    // Execute all nodes in the branch sequentially
    let result: any;

    for (const nodeId of branch.nodeIds) {
      result = await this.executeNode(executionId, nodeId, result);
    }

    return result;
  }

  private async executeNode(executionId: string, nodeId: string, input: any): Promise<any> {
    // Placeholder for node execution
    return { nodeId, input, executed: true };
  }

  private async processBatch(
    batch: any[],
    executeItem: (item: any, index: number) => Promise<any>,
    concurrency: number,
  ): Promise<{ results: any[]; errors: any[] }> {
    const semaphore = new Semaphore(concurrency);
    const results: any[] = [];
    const errors: any[] = [];

    await Promise.all(
      batch.map(async (item, index) => {
        await semaphore.acquire();

        try {
          const result = await executeItem(item, index);
          results.push({ item, result });
        } catch (error) {
          errors.push({ item, error: error.message });
        } finally {
          semaphore.release();
        }
      }),
    );

    return { results, errors };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private aggregateResults(
    results: any[],
    strategy: 'all' | 'first' | 'last',
  ): any {
    switch (strategy) {
      case 'first':
        return results[0]?.result || null;

      case 'last':
        return results[results.length - 1]?.result || null;

      case 'all':
      default:
        return results.map(r => r.result);
    }
  }

  private async logError(
    executionId: string,
    nodeId: string,
    error: string,
  ): Promise<void> {
    await this.prisma.workflowExecutionLog.create({
      data: {
        executionId,
        nodeId,
        level: 'ERROR',
        message: error,
      },
    });
  }
}

/**
 * Simple semaphore implementation for concurrency control
 */
class Semaphore {
  private permits: number;
  private queue: (() => void)[];

  constructor(initialPermits: number) {
    this.permits = initialPermits;
    this.queue = [];
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
    } else {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next!();
    } else {
      this.permits++;
    }
  }

  releaseAll(): void {
    this.permits += this.queue.length + 1;
    this.queue.forEach(next => next());
    this.queue = [];
  }
}
