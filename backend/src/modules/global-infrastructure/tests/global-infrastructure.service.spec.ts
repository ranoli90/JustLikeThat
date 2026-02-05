import { Test, TestingModule } from '@nestjs/testing';
import { MultiRegionService } from '../services/multi-region.service';
import { EdgeComputingService } from '../services/edge-computing.service';
import { CDNOptimizationService } from '../services/cdn-optimization.service';
import { DataResidencyService } from '../services/data-residency.service';
import { GeoDatabaseService } from '../services/geo-database.service';
import { DisasterRecoveryService } from '../services/disaster-recovery.service';

// Mock PrismaService
const mockPrismaService = {
  regionConfig: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  regionHealth: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  edgeLocation: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  edgeFunction: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  cDNConfiguration: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  dataResidencyRule: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  dataResidencyAudit: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  globalDatabase: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
  globalDatabaseConnection: {
    findMany: jest.fn(),
  },
  disasterRecoveryPlan: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  dRTestRecord: {
    create: jest.fn(),
  },
  failoverEvent: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  backupRecord: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
};

describe('MultiRegionService', () => {
  let service: MultiRegionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiRegionService,
        {
          provide: 'PrismaService',
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MultiRegionService>(MultiRegionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRegions', () => {
    it('should return all regions', async () => {
      const mockRegions = [
        { regionId: 'aws-us-east-1', name: 'US East', cloudProvider: 'aws', regionName: 'us-east-1', status: 'active', priority: 1, isPrimary: true },
      ];
      mockPrismaService.regionConfig.findMany.mockResolvedValue(mockRegions);

      const result = await service.getAllRegions();

      expect(result).toEqual(mockRegions);
      expect(mockPrismaService.regionConfig.findMany).toHaveBeenCalled();
    });
  });

  describe('getRegionById', () => {
    it('should return a region by ID', async () => {
      const mockRegion = { regionId: 'aws-us-east-1', name: 'US East', cloudProvider: 'aws', status: 'active' };
      mockPrismaService.regionConfig.findUnique.mockResolvedValue(mockRegion);

      const result = await service.getRegionById('aws-us-east-1');

      expect(result).toEqual(mockRegion);
      expect(mockPrismaService.regionConfig.findUnique).toHaveBeenCalledWith({ where: { regionId: 'aws-us-east-1' } });
    });
  });

  describe('createRegion', () => {
    it('should create a new region', async () => {
      const newRegion = { name: 'New Region', cloudProvider: 'aws', regionName: 'us-west-2', status: 'active' };
      const createdRegion = { ...newRegion, regionId: 'aws-us-west-2', priority: 1, isPrimary: false };
      mockPrismaService.regionConfig.create.mockResolvedValue(createdRegion);

      const result = await service.createRegion(newRegion);

      expect(result).toEqual(createdRegion);
      expect(mockPrismaService.regionConfig.create).toHaveBeenCalled();
    });
  });

  describe('updateRegion', () => {
    it('should update a region', async () => {
      const updatedRegion = { regionId: 'aws-us-east-1', name: 'Updated Name', status: 'maintenance' };
      mockPrismaService.regionConfig.update.mockResolvedValue(updatedRegion);

      const result = await service.updateRegion('aws-us-east-1', { name: 'Updated Name', status: 'maintenance' });

      expect(result).toEqual(updatedRegion);
      expect(mockPrismaService.regionConfig.update).toHaveBeenCalled();
    });
  });

  describe('getAllRegionHealth', () => {
    it('should return health for all regions', async () => {
      const mockRegions = [
        { regionId: 'aws-us-east-1', name: 'US East', cloudProvider: 'aws', status: 'active' },
      ];
      const mockHealth = { regionId: 'aws-us-east-1', latency: 50, errorRate: 0.01, throughput: 1000 };
      
      mockPrismaService.regionConfig.findMany.mockResolvedValue(mockRegions);
      mockPrismaService.regionHealth.findFirst.mockResolvedValue(mockHealth);

      const result = await service.getAllRegionHealth();

      expect(result).toHaveLength(1);
      expect(result[0].regionId).toBe('aws-us-east-1');
    });
  });
});

describe('EdgeComputingService', () => {
  let service: EdgeComputingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EdgeComputingService,
        {
          provide: 'PrismaService',
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EdgeComputingService>(EdgeComputingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllEdgeLocations', () => {
    it('should return all active edge locations', async () => {
      const mockLocations = [
        { locationId: 'cf-us-east-1', city: 'New York', country: 'US', isActive: true },
      ];
      mockPrismaService.edgeLocation.findMany.mockResolvedValue(mockLocations);

      const result = await service.getAllEdgeLocations();

      expect(result).toEqual(mockLocations);
      expect(mockPrismaService.edgeLocation.findMany).toHaveBeenCalledWith({ where: { isActive: true } });
    });
  });

  describe('deployEdgeFunction', () => {
    it('should deploy an edge function', async () => {
      const functionData = {
        name: 'Test Function',
        provider: 'cloudflare' as const,
        code: 'export default () => new Response("Hello")',
        runtime: 'javascript' as const,
        memory: 128,
        timeout: 30,
        environment: {},
        routes: ['/api/*'],
      };
      
      const createdFunction = {
        ...functionData,
        functionId: 'edge-123',
        version: 1,
        status: 'deployed',
      };
      
      mockPrismaService.edgeFunction.create.mockResolvedValue(createdFunction);

      const result = await service.deployEdgeFunction(functionData);

      expect(result.functionId).toBeDefined();
      expect(result.status).toBe('deployed');
    });
  });

  describe('getGlobalEdgeMetrics', () => {
    it('should return metrics for all edge locations', async () => {
      const mockLocations = [
        { locationId: 'cf-us-east-1', isActive: true },
        { locationId: 'cf-us-west-1', isActive: true },
      ];
      
      mockPrismaService.edgeLocation.findMany.mockResolvedValue(mockLocations);

      const result = await service.getGlobalEdgeMetrics();

      expect(result).toHaveLength(2);
    });
  });
});

describe('CDNOptimizationService', () => {
  let service: CDNOptimizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CDNOptimizationService,
        {
          provide: 'PrismaService',
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CDNOptimizationService>(CDNOptimizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllConfigurations', () => {
    it('should return all CDN configurations', async () => {
      const mockConfigs = [
        { configId: 'cdn-1', name: 'CloudFront', provider: 'cloudfront', status: 'active' },
      ];
      mockPrismaService.cDNConfiguration.findMany.mockResolvedValue(mockConfigs);

      const result = await service.getAllConfigurations();

      expect(result).toEqual(mockConfigs);
    });
  });

  describe('purgeCache', () => {
    it('should purge cache for specified paths', async () => {
      const result = await service.purgeCache('cdn-1', ['/static/*', '/images/*']);

      expect(result.success).toBe(true);
      expect(result.purgedPaths).toBe(2);
    });
  });

  describe('calculateCacheHitRatio', () => {
    it('should calculate cache hit ratio', async () => {
      const mockConfigs = [{ configId: 'cdn-1' }];
      mockPrismaService.cDNConfiguration.findMany.mockResolvedValue(mockConfigs);
      
      // Mock getAnalytics to return known values
      jest.spyOn(service, 'getAnalytics').mockResolvedValue({
        configId: 'cdn-1',
        requests: 1000000,
        cacheHits: 900000,
        cacheMisses: 100000,
        bandwidth: 1000000000,
        latencyP50: 10,
        latencyP95: 30,
        latencyP99: 50,
      });

      const result = await service.calculateCacheHitRatio();

      expect(result).toBeCloseTo(90, 0);
    });
  });
});

describe('DataResidencyService', () => {
  let service: DataResidencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataResidencyService,
        {
          provide: 'PrismaService',
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DataResidencyService>(DataResidencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRules', () => {
    it('should return all data residency rules', async () => {
      const mockRules = [
        { ruleId: 'rule-1', region: 'eu', dataType: 'user_data', storageRegions: ['eu-west-1'] },
      ];
      mockPrismaService.dataResidencyRule.findMany.mockResolvedValue(mockRules);

      const result = await service.getAllRules();

      expect(result).toEqual(mockRules);
    });
  });

  describe('createRule', () => {
    it('should create a new data residency rule', async () => {
      const ruleData = {
        region: 'eu' as const,
        dataType: 'user_data' as const,
        storageRegions: ['eu-west-1'],
        isRequired: true,
        retentionDays: 2555,
      };
      
      mockPrismaService.dataResidencyRule.create.mockResolvedValue({ ruleId: 'rule-new', ...ruleData });

      const result = await service.createRule(ruleData);

      expect(result.ruleId).toBeDefined();
      expect(result.region).toBe('eu');
    });
  });

  describe('logAuditEvent', () => {
    it('should log an audit event and check compliance', async () => {
      const mockRule = {
        ruleId: 'rule-1',
        storageRegions: ['eu-west-1'],
        isRequired: true,
      };
      
      const event = {
        ruleId: 'rule-1',
        operation: 'read' as const,
        sourceRegion: 'eu-west-1',
        dataType: 'user_data',
        ipAddress: '192.168.1.1',
      };

      mockPrismaService.dataResidencyRule.findUnique.mockResolvedValue(mockRule);
      mockPrismaService.dataResidencyAudit.create.mockResolvedValue({ ...event, compliance: true, timestamp: new Date() });

      const result = await service.logAuditEvent(event);

      expect(result.compliance).toBe(true);
    });
  });
});

describe('GeoDatabaseService', () => {
  let service: GeoDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoDatabaseService,
        {
          provide: 'PrismaService',
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GeoDatabaseService>(GeoDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDatabases', () => {
    it('should return all global databases', async () => {
      const mockDatabases = [
        { databaseId: 'db-1', name: 'CockroachDB', type: 'cockroachdb', status: 'active' },
      ];
      mockPrismaService.globalDatabase.findMany.mockResolvedValue(mockDatabases);

      const result = await service.getAllDatabases();

      expect(result).toEqual(mockDatabases);
    });
  });

  describe('scaleDatabase', () => {
    it('should scale a database', async () => {
      mockPrismaService.globalDatabase.update.mockResolvedValue({
        databaseId: 'db-1',
        name: 'CockroachDB',
        connectionPool: 200,
        readReplicas: 10,
      });

      const result = await service.scaleDatabase('db-1', 10, 200);

      expect(result.readReplicas).toBe(10);
      expect(result.connectionPool).toBe(200);
    });
  });

  describe('checkReplicationLag', () => {
    it('should check if replication lag is within SLA', async () => {
      mockPrismaService.globalDatabase.findUnique.mockResolvedValue({
        databaseId: 'db-1',
        replicationLag: 50,
      });

      const result = await service.checkReplicationLag('db-1');

      expect(result.withinSLA).toBe(true);
      expect(result.lag).toBeLessThan(100);
    });
  });
});

describe('DisasterRecoveryService', () => {
  let service: DisasterRecoveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisasterRecoveryService,
        {
          provide: 'PrismaService',
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DisasterRecoveryService>(DisasterRecoveryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPlans', () => {
    it('should return all DR plans', async () => {
      const mockPlans = [
        { planId: 'plan-1', name: 'Global Failover', rtoMinutes: 15, rpoMinutes: 5 },
      ];
      mockPrismaService.disasterRecoveryPlan.findMany.mockResolvedValue(mockPlans);

      const result = await service.getAllPlans();

      expect(result).toEqual(mockPlans);
    });
  });

  describe('runDRTest', () => {
    it('should run a DR test', async () => {
      const mockPlan = {
        planId: 'plan-1',
        name: 'Global Failover',
        rtoMinutes: 15,
        rpoMinutes: 5,
        plan: [
          { stepNumber: 1, description: 'Detect failure', estimatedDuration: 60 },
        ],
      };
      
      mockPrismaService.disasterRecoveryPlan.findUnique.mockResolvedValue(mockPlan);
      mockPrismaService.dRTestRecord.create.mockResolvedValue({
        testId: 'test-1',
        status: 'passed',
      });
      mockPrismaService.disasterRecoveryPlan.update.mockResolvedValue(mockPlan);

      const result = await service.runDRTest('plan-1', 'simulation');

      expect(result.testId).toBeDefined();
      expect(result.status).toBe('passed');
    });
  });

  describe('createBackup', () => {
    it('should create a backup', async () => {
      mockPrismaService.backupRecord.create.mockResolvedValue({
        backupId: 'backup-1',
        databaseId: 'db-1',
        backupType: 'full',
        status: 'completed',
        sizeBytes: BigInt(1000000000),
        encrypted: true,
      });

      const result = await service.createBackup('db-1', 'full');

      expect(result.backupId).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.encrypted).toBe(true);
    });
  });

  describe('getDRMetrics', () => {
    it('should return DR metrics', async () => {
      const mockPlans = [
        { planId: 'plan-1', rtoMinutes: 15, rpoMinutes: 5, nextTest: new Date(Date.now() + 10000000) },
      ];
      
      mockPrismaService.disasterRecoveryPlan.findMany.mockResolvedValue(mockPlans);
      mockPrismaService.failoverEvent.count.mockResolvedValue(2);
      mockPrismaService.backupRecord.count.mockResolvedValue(10);
      mockPrismaService.backupRecord.findFirst.mockResolvedValue({ startedAt: new Date() });

      const result = await service.getDRMetrics();

      expect(result.activePlans).toBe(1);
      expect(result.backupCount).toBe(10);
    });
  });
});
