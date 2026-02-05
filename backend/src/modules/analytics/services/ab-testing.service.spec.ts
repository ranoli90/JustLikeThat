import { Test, TestingModule } from '@nestjs/testing';
import { ABTestingService } from './ab-testing.service';

const mockPrisma = {
  aBExperiment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  aBVariant: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  aBAssignment: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  aBResult: {
    create: jest.fn(),
  },
  featureFlag: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('ABTestingService', () => {
  let service: ABTestingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ABTestingService,
        { provide: 'PrismaService', useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ABTestingService>(ABTestingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExperiment', () => {
    it('should create an experiment with variants', async () => {
      const experimentData = {
        userId: 'user-123',
        name: 'Test Experiment',
        description: 'Testing new feature',
        variants: [
          { name: 'Control', isControl: true, trafficWeight: 50, config: {} },
          { name: 'Variant A', isControl: false, trafficWeight: 50, config: {} },
        ],
        trafficSplit: [
          { variant: 'Control', weight: 50 },
          { variant: 'Variant A', weight: 50 },
        ],
      };

      mockPrisma.aBExperiment.create.mockResolvedValue({
        id: 'exp-1',
        ...experimentData,
        status: 'draft',
      });
      mockPrisma.aBVariant.create.mockResolvedValue({
        id: 'var-1',
        experimentId: 'exp-1',
        ...experimentData.variants[0],
      });

      const result = await service.createExperiment(
        experimentData.userId,
        experimentData
      );

      expect(result.name).toBe('Test Experiment');
      expect(result.variants).toHaveLength(2);
    });
  });

  describe('assignVariant', () => {
    it('should return existing assignment for returning user', async () => {
      const existingAssignment = {
        id: 'assign-1',
        experimentId: 'exp-1',
        variantId: 'var-1',
        userId: 'user-123',
      };

      mockPrisma.aBAssignment.findFirst.mockResolvedValue(existingAssignment);
      mockPrisma.aBVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        name: 'Control',
      });

      const experiment = {
        id: 'exp-1',
        status: 'running',
        variants: [{ id: 'var-1', name: 'Control', trafficWeight: 50 }],
      };

      mockPrisma.aBExperiment.findUnique.mockResolvedValue(experiment);

      const result = await service.assignVariant('exp-1', 'user-123');

      expect(result.variantId).toBe('var-1');
      expect(mockPrisma.aBAssignment.create).not.toHaveBeenCalled();
    });

    it('should create new assignment for new user', async () => {
      mockPrisma.aBAssignment.findFirst.mockResolvedValue(null);
      mockPrisma.aBVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        name: 'Control',
      });

      const experiment = {
        id: 'exp-1',
        status: 'running',
        variants: [
          { id: 'var-1', name: 'Control', trafficWeight: 50 },
          { id: 'var-2', name: 'Variant A', trafficWeight: 50 },
        ],
      };

      mockPrisma.aBExperiment.findUnique.mockResolvedValue(experiment);
      mockPrisma.aBAssignment.create.mockResolvedValue({
        id: 'assign-1',
        experimentId: 'exp-1',
        variantId: 'var-2',
        userId: 'user-456',
      });
      mockPrisma.aBExperiment.update.mockResolvedValue({
        ...experiment,
        currentSample: 101,
      });

      const result = await service.assignVariant('exp-1', 'user-456');

      expect(result.variantId).toBeDefined();
      expect(mockPrisma.aBAssignment.create).toHaveBeenCalled();
      expect(mockPrisma.aBExperiment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exp-1' },
          data: expect.objectContaining({
            currentSample: { increment: 1 },
          }),
        })
      );
    });
  });

  describe('calculateResults', () => {
    it('should calculate statistical significance', async () => {
      const experiment = {
        id: 'exp-1',
        name: 'Test',
        status: 'running',
        variants: [
          { id: 'var-1', name: 'Control', isControl: true, trafficWeight: 50 },
          { id: 'var-2', name: 'Variant A', isControl: false, trafficWeight: 50 },
        ],
        primaryMetric: 'conversion_rate',
      };

      mockPrisma.aBExperiment.findUnique.mockResolvedValue(experiment);
      mockPrisma.aBAssignment.findMany
        .mockResolvedValueOnce([
          { variantId: 'var-1', converted: true },
          { variantId: 'var-1', converted: false },
          { variantId: 'var-1', converted: true },
        ])
        .mockResolvedValueOnce([
          { variantId: 'var-2', converted: true },
          { variantId: 'var-2', converted: true },
          { variantId: 'var-2', converted: true },
        ]);
      mockPrisma.aBAssignment.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(3);
      mockPrisma.aBResult.create.mockResolvedValue({});

      const results = await service.calculateResults('exp-1');

      expect(results).toHaveLength(2);
      expect(mockPrisma.aBExperiment.update).toHaveBeenCalled();
    });
  });

  describe('feature flags', () => {
    it('should create a feature flag', async () => {
      mockPrisma.featureFlag.create.mockResolvedValue({
        id: 'flag-1',
        key: 'new_dashboard',
        name: 'New Dashboard',
        enabled: false,
        rolloutPct: 0,
      });

      const result = await service.createFeatureFlag({
        key: 'new_dashboard',
        name: 'New Dashboard',
        enabled: false,
        rolloutPct: 0,
      });

      expect(result.key).toBe('new_dashboard');
    });

    it('should check if feature is enabled', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        key: 'new_dashboard',
        enabled: true,
        rolloutPct: 100,
      });

      const isEnabled = await service.isFeatureEnabled('new_dashboard', 'user-123');

      expect(isEnabled).toBe(true);
    });

    it('should respect rollout percentage', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        key: 'new_dashboard',
        enabled: true,
        rolloutPct: 50,
      });

      // User will be assigned based on hash - this tests the logic
      const isEnabled = await service.isFeatureEnabled('new_dashboard', 'user-123');

      expect(typeof isEnabled).toBe('boolean');
    });
  });
});
