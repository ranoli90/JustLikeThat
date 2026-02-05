import { Test, TestingModule } from '@nestjs/testing';
import { TracingService, TraceSpan } from './tracing.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TracingService', () => {
  let service: TracingService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrisma = {
    trace: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TracingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TracingService>(TracingService);
    prismaService = module.get(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('createSpan', () => {
    it('should create a new trace span', async () => {
      const span: TraceSpan = {
        traceId: 'test-trace-123',
        spanId: '',
        operationName: 'test-operation',
        serviceName: 'test-service',
        startTime: new Date(),
        duration: 100,
        tags: { key: 'value' },
        logs: [],
      };

      mockPrisma.trace.create.mockResolvedValue({
        id: 'uuid-123',
        ...span,
      });

      const result = await service.createSpan(span);

      expect(result).toBeDefined();
      expect(mockPrisma.trace.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          traceId: span.traceId,
          operationName: span.operationName,
          serviceName: span.serviceName,
        }),
      });
    });

    it('should include parent span ID if provided', async () => {
      const span: TraceSpan = {
        traceId: 'test-trace-123',
        spanId: '',
        parentSpanId: 'parent-span-123',
        operationName: 'test-operation',
        serviceName: 'test-service',
        startTime: new Date(),
        duration: 100,
        tags: {},
        logs: [],
      };

      mockPrisma.trace.create.mockResolvedValue({
        id: 'uuid-123',
        ...span,
      });

      await service.createSpan(span);

      expect(mockPrisma.trace.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          parentSpanId: 'parent-span-123',
        }),
      });
    });
  });

  describe('getTrace', () => {
    it('should return trace by ID', async () => {
      const mockTraces = [
        { traceId: 'test-trace', spanId: 'span-1', operationName: 'op1' },
        { traceId: 'test-trace', spanId: 'span-2', operationName: 'op2' },
      ];

      mockPrisma.trace.findMany.mockResolvedValue(mockTraces as any);

      const result = await service.getTrace('test-trace');

      expect(result).toEqual(mockTraces);
      expect(mockPrisma.trace.findMany).toHaveBeenCalledWith({
        where: { traceId: 'test-trace' },
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('searchTraces', () => {
    it('should search traces with filters', async () => {
      const mockTraces = [
        { traceId: 'trace-1', serviceName: 'api-service' },
      ];
      const mockCount = 1;

      mockPrisma.trace.findMany.mockResolvedValue(mockTraces as any);
      mockPrisma.trace.count.mockResolvedValue(mockCount);

      const result = await service.searchTraces({
        serviceName: 'api-service',
        limit: 50,
        offset: 0,
      });

      expect(result.traces).toEqual(mockTraces);
      expect(result.total).toBe(mockCount);
    });

    it('should filter by time range', async () => {
      const startTime = new Date('2024-01-01');
      const endTime = new Date('2024-01-31');

      mockPrisma.trace.findMany.mockResolvedValue([]);
      mockPrisma.trace.count.mockResolvedValue(0);

      await service.searchTraces({
        startTime,
        endTime,
      });

      expect(mockPrisma.trace.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          startTime: {
            gte: startTime,
            lte: endTime,
          },
        }),
        take: 100,
        skip: 0,
        orderBy: { startTime: 'desc' },
      });
    });
  });

  describe('getServices', () => {
    it('should return list of services', async () => {
      const mockServices = [
        { serviceName: 'service-1', _count: 100 },
        { serviceName: 'service-2', _count: 200 },
      ];

      mockPrisma.trace.groupBy.mockResolvedValue(mockServices as any);

      const result = await service.getServices();

      expect(result).toEqual([
        { name: 'service-1', spanCount: 100 },
        { name: 'service-2', spanCount: 200 },
      ]);
    });
  });

  describe('getOperations', () => {
    it('should return operations for a service', async () => {
      const mockOperations = [
        { operationName: 'GET /api/users', _count: 50 },
        { operationName: 'POST /api/users', _count: 30 },
      ];

      mockPrisma.trace.groupBy.mockResolvedValue(mockOperations as any);

      const result = await service.getOperations('api-service');

      expect(result).toEqual([
        { name: 'GET /api/users', spanCount: 50 },
        { name: 'POST /api/users', spanCount: 30 },
      ]);
    });
  });

  describe('shouldSample', () => {
    it('should return boolean based on sampling rate', () => {
      service.setSamplingRate(1.0);
      expect(service.shouldSample()).toBe(true);

      service.setSamplingRate(0.0);
      expect(service.shouldSample()).toBe(false);
    });
  });

  describe('generateTraceContext', () => {
    it('should generate trace context', () => {
      const context = service.generateTraceContext();

      expect(context.traceId).toBeDefined();
      expect(context.spanId).toBeDefined();
      expect(context.traceId.length).toBe(32);
      expect(context.spanId.length).toBe(16);
    });
  });

  describe('setSamplingRate', () => {
    it('should throw error for invalid rate', () => {
      expect(() => service.setSamplingRate(-0.1)).toThrow();
      expect(() => service.setSamplingRate(1.1)).toThrow();
    });

    it('should accept valid rate', () => {
      expect(() => service.setSamplingRate(0.5)).not.toThrow();
    });
  });

  describe('cleanupOldTraces', () => {
    it('should delete old traces', async () => {
      mockPrisma.trace.deleteMany.mockResolvedValue({ count: 100 });

      const result = await service.cleanupOldTraces();

      expect(result).toBe(100);
    });
  });
});
