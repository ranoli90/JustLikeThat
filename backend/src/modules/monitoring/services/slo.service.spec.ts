import { Test, TestingModule } from '@nestjs/testing';
import { SLOService, SLOConfig, SLIResult } from './slo.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SLOService', () => {
  let service: SLOService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrisma = {
    sLOConfig: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sLIResult: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SLOService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SLOService>(SLOService);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('createSLO', () => {
    it('should create a new SLO configuration', async () => {
      const config: SLOConfig = {
        name: 'API Availability',
        description: 'API availability SLO',
        serviceName: 'api-service',
        sliType: 'availability',
        target: 99.9,
        window: '30d',
      };

      mockPrisma.sLOConfig.create.mockResolvedValue({
        id: 'slo-123',
        ...config,
      } as any);

      const result = await service.createSLO(config);

      expect(result).toBe('slo-123');
      expect(mockPrisma.sLOConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: config.name,
          target: config.target,
          window: config.window,
        }),
      });
    });
  });

  describe('getSLOs', () => {
    it('should return all SLO configurations', async () => {
      const mockSLOs = [
        { id: '1', name: 'SLO 1' },
        { id: '2', name: 'SLO 2' },
      ];

      mockPrisma.sLOConfig.findMany.mockResolvedValue(mockSLOs as any);

      const result = await service.getSLOs();

      expect(result).toEqual(mockSLOs);
    });
  });

  describe('getSLOStatus', () => {
    it('should return SLO status with measurements', async () => {
      const mockSLO = {
        id: 'slo-123',
        name: 'API Availability',
        serviceName: 'api-service',
        sliType: 'availability',
        target: 99.9,
        window: '30d',
      };

      const mockSLIResults = [
        { sloId: 'slo-123', measurement: 99.95, totalRequests: 1000, successfulRequests: 995 },
        { sloId: 'slo-123', measurement: 99.99, totalRequests: 1000, successfulRequests: 999 },
      ];

      mockPrisma.sLOConfig.findUnique.mockResolvedValue(mockSLO as any);
      mockPrisma.sLIResult.findMany.mockResolvedValue(mockSLIResults as any);

      const result = await service.getSLOStatus('slo-123');

      expect(result.slo).toEqual(mockSLO);
      expect(result.currentMeasurement).toBeGreaterThan(0);
      expect(result.status).toBeDefined();
    });

    it('should return warning status when no data', async () => {
      const mockSLO = {
        id: 'slo-123',
        name: 'API Availability',
        serviceName: 'api-service',
        sliType: 'availability',
        target: 99.9,
        window: '30d',
      };

      mockPrisma.sLOConfig.findUnique.mockResolvedValue(mockSLO as any);
      mockPrisma.sLIResult.findMany.mockResolvedValue([]);

      const result = await service.getSLOStatus('slo-123');

      expect(result.status).toBe('warning');
    });
  });

  describe('getErrorBudget', () => {
    it('should calculate error budget correctly', async () => {
      const mockSLO = {
        id: 'slo-123',
        target: 99.9,
        window: '30d',
      };

      const mockSLIResults = [
        { sloId: 'slo-123', totalRequests: 100000, successfulRequests: 99900 },
      ];

      mockPrisma.sLOConfig.findUnique.mockResolvedValue(mockSLO as any);
      mockPrisma.sLIResult.findMany.mockResolvedValue(mockSLIResults as any);

      const result = await service.getErrorBudget('slo-123');

      expect(result.budget).toBe(0.1); // 100 - 99.9
      expect(result.remaining).toBeLessThanOrEqual(result.budget);
    });
  });

  describe('recordSLI', () => {
    it('should record SLI measurement', async () => {
      const sliResult: SLIResult = {
        sloId: 'slo-123',
        timestamp: new Date(),
        measurement: 99.95,
        totalRequests: 1000,
        successfulRequests: 999,
      };

      mockPrisma.sLIResult.create.mockResolvedValue({
        id: 'sli-123',
        ...sliResult,
      } as any);

      const result = await service.recordSLI(sliResult);

      expect(result).toBe('sli-123');
    });
  });

  describe('getSLOHealthDashboard', () => {
    it('should return health dashboard data', async () => {
      const mockSLOs = [
        { id: '1', name: 'SLO 1', target: 99.9 },
        { id: '2', name: 'SLO 2', target: 99.5 },
      ];

      mockPrisma.sLOConfig.findMany.mockResolvedValue(mockSLOs as any);
      mockPrisma.sLIResult.findMany.mockResolvedValue([]);

      const result = await service.getSLOHealthDashboard();

      expect(result.totalSLOs).toBe(2);
      expect(result.sloList).toHaveLength(2);
    });
  });
});
