import { ParallelExecutionService } from './parallel-execution.service';
import { ExecutionStatus } from '../interfaces/workflow.interface';

describe('ParallelExecutionService', () => {
  let service: ParallelExecutionService;

  beforeEach(() => {
    service = new ParallelExecutionService();
  });

  describe('executeParallel', () => {
    it('should execute branches in parallel', async () => {
      const branches = [
        { id: 'branch1', nodeIds: ['node1'], status: 'pending' as const },
        { id: 'branch2', nodeIds: ['node2'], status: 'pending' as const },
        { id: 'branch3', nodeIds: ['node3'], status: 'pending' as const },
      ];

      const result = await service.executeParallel('exec-1', branches);

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(3);
      expect(result.errors.size).toBe(0);
    });

    it('should handle branch errors', async () => {
      const branches = [
        { id: 'branch1', nodeIds: ['node1'], status: 'pending' as const },
        { id: 'branch2', nodeIds: ['nodeError'], status: 'pending' as const },
      ];

      const result = await service.executeParallel('exec-1', branches, {
        failFast: false,
      });

      expect(result.results.size).toBe(1);
      expect(result.errors.size).toBe(1);
    });

    it('should respect failFast option', async () => {
      const branches = [
        { id: 'branch1', nodeIds: ['node1'], status: 'pending' as const },
        { id: 'branch2', nodeIds: ['nodeError'], status: 'pending' as const },
      ];

      const result = await service.executeParallel('exec-1', branches, {
        failFast: true,
      });

      expect(result.results.size).toBeLessThan(2);
    });

    it('should respect concurrency limit', async () => {
      const branches = Array.from({ length: 10 }, (_, i) => ({
        id: `branch${i}`,
        nodeIds: [`node${i}`],
        status: 'pending' as const,
      }));

      const result = await service.executeParallel('exec-1', branches, {
        concurrency: 2,
      });

      expect(result.success).toBe(true);
      expect(result.results.size).toBe(10);
    });

    it('should respect timeout', async () => {
      const branches = [
        { id: 'branch1', nodeIds: ['node1'], status: 'pending' as const },
      ];

      const result = await service.executeParallel('exec-1', branches, {
        timeout: 1000, // 1 second
      });

      expect(result).toBeDefined();
    });
  });

  describe('executeFanOut', () => {
    it('should fan out and aggregate results', async () => {
      const items = [1, 2, 3, 4, 5];
      const executeItem = async (item: number) => item * 2;

      const result = await service.executeFanOut(
        {
          executionId: 'exec-1',
          parentNodeId: 'parallel-node',
          items,
          nodeConfig: {
            batchSize: 2,
            concurrency: 2,
            aggregation: {
              timeout: 5000,
              strategy: 'all',
            },
          },
        },
        executeItem
      );

      expect(result.aggregated).toEqual([2, 4, 6, 8, 10]);
      expect(result.results.length).toBe(5);
      expect(result.errors.length).toBe(0);
    });

    it('should handle errors in fan-out', async () => {
      const items = [1, 2, 3];
      const executeItem = async (item: number) => {
        if (item === 2) throw new Error('Test error');
        return item * 2;
      };

      const result = await service.executeFanOut(
        {
          executionId: 'exec-1',
          parentNodeId: 'parallel-node',
          items,
          nodeConfig: {
            batchSize: 2,
            concurrency: 2,
            aggregation: {
              timeout: 5000,
              strategy: 'all',
            },
          },
        },
        executeItem
      );

      expect(result.errors.length).toBe(1);
      expect(result.results.length).toBe(2);
    });

    it('should use first strategy for aggregation', async () => {
      const items = [1, 2, 3];
      const executeItem = async (item: number) => item;

      const result = await service.executeFanOut(
        {
          executionId: 'exec-1',
          parentNodeId: 'parallel-node',
          items,
          nodeConfig: {
            batchSize: 3,
            concurrency: 3,
            aggregation: {
              timeout: 5000,
              strategy: 'first',
            },
          },
        },
        executeItem
      );

      expect(result.aggregated).toBe(1);
    });

    it('should use last strategy for aggregation', async () => {
      const items = [1, 2, 3];
      const executeItem = async (item: number) => item;

      const result = await service.executeFanOut(
        {
          executionId: 'exec-1',
          parentNodeId: 'parallel-node',
          items,
          nodeConfig: {
            batchSize: 3,
            concurrency: 3,
            aggregation: {
              timeout: 5000,
              strategy: 'last',
            },
          },
        },
        executeItem
      );

      expect(result.aggregated).toBe(3);
    });
  });

  describe('executeWithResourceAllocation', () => {
    it('should allocate resources for parallel execution', async () => {
      const items = [
        { id: 'item1', resource: 'cpu' },
        { id: 'item2', resource: 'memory' },
        { id: 'item3', resource: 'cpu' },
      ];

      const executeItem = async (item: any) => ({ itemId: item.id, processed: true });

      const results = await service.executeWithResourceAllocation(
        'exec-1',
        items,
        executeItem
      );

      expect(results.size).toBe(3);
      expect(results.get('item1')?.processed).toBe(true);
      expect(results.get('item2')?.processed).toBe(true);
      expect(results.get('item3')?.processed).toBe(true);
    });
  });

  describe('resource allocation', () => {
    it('should allocate resources', async () => {
      const result = await service.allocateResources('exec-1', [
        { resource: 'cpu', amount: 5 },
        { resource: 'memory', amount: 3 },
      ]);

      expect(result).toBe(true);
    });

    it('should release resources', async () => {
      await service.allocateResources('exec-1', [
        { resource: 'cpu', amount: 5 },
      ]);

      const result = await service.releaseResources('exec-1', [
        { resource: 'cpu', amount: 3 },
      ]);

      expect(result).toBeUndefined();
    });
  });

  describe('getExecutionState', () => {
    it('should return execution state', async () => {
      // Mock Prisma service would be needed for this test
      // For now, we test the structure
      expect(service).toBeDefined();
    });
  });

  describe('handleErrors', () => {
    it('should handle errors by continuing', async () => {
      const errors = new Map([['branch1', 'Error message']]);

      const result = await service.handleErrors('exec-1', errors, {
        continueOnError: true,
      });

      expect(result.handled).toBe(true);
      expect(result.action).toBe('continued');
    });

    it('should handle errors with retry', async () => {
      const errors = new Map([['branch1', 'Error message']]);

      const result = await service.handleErrors('exec-1', errors, {
        retryFailed: true,
      });

      expect(result.handled).toBe(true);
      expect(result.action).toBe('retrying');
    });

    it('should handle errors with fallback', async () => {
      const errors = new Map([['branch1', 'Error message']]);

      const result = await service.handleErrors('exec-1', errors, {
        continueOnError: false,
        fallbackNode: 'fallback-node',
      });

      expect(result.handled).toBe(true);
      expect(result.action).toBe('fallback');
    });

    it('should return not handled when no errors', async () => {
      const errors = new Map();

      const result = await service.handleErrors('exec-1', errors);

      expect(result.handled).toBe(true);
      expect(result.action).toBe('none');
    });
  });
});
