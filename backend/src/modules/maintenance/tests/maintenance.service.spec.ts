// Unit Tests for Maintenance Services - Sprint 48

import { Test, TestingModule } from '@nestjs/testing';
import { TechnicalDebtService } from '../services/technical-debt.service';
import { CodeRefactoringService } from '../services/code-refactoring.service';
import { SecurityPatchService } from '../services/security-patch.service';
import { DependencyUpdateService } from '../services/dependency-update.service';
import { InnovationSandboxService } from '../services/innovation-sandbox.service';
import { PerformanceOptimizationService } from '../services/performance-optimization.service';
import { SonarQubeService } from '../services/sonar-qube.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TechnicalDebt } from '../entities/technical-debt.entity';
import { CodeQualityMetrics } from '../entities/code-quality-metrics.entity';
import { SecurityPatch, SecurityVulnerability } from '../entities/security-patch.entity';
import { DependencyUpdate, DependencyInventory } from '../entities/dependency-update.entity';
import { InnovationExperiment, FeatureFlag, ExperimentParticipant, UserFeedback } from '../entities/innovation-sandbox.entity';
import { PerformanceSnapshot, OptimizationRecommendation, LoadTestResult, CacheMetrics } from '../entities/performance.entity';

describe('TechnicalDebtService', () => {
  let service: TechnicalDebtService;
  let repository: jest.Mocked<Repository<TechnicalDebt>>;
  let metricsRepository: jest.Mocked<Repository<CodeQualityMetrics>>;
  let sonarQubeService: jest.Mocked<SonarQubeService>;

  const mockDebtItem = {
    id: 'test-debt-1',
    category: 'code',
    severity: 'high',
    description: 'Complex function needs refactoring',
    filePath: 'src/test.service.ts',
    lineNumber: 42,
    estimatedHours: 4,
    actualHours: null,
    status: 'identified',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn().mockImplementation((data) => ({ id: 'test-debt-1', ...data })),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
      find: jest.fn().mockResolvedValue([mockDebtItem]),
      findOne: jest.fn().mockResolvedValue(mockDebtItem),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(10),
    };

    const mockMetricsRepository = {
      create: jest.fn().mockImplementation((data) => ({ id: 'metrics-1', ...data })),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };

    const mockSonarQubeService = {
      getIssues: jest.fn().mockResolvedValue([
        {
          key: 'issue-1',
          component: 'src/test.ts',
          line: 10,
          message: 'Test issue',
          type: 'CODE_SMELL',
          severity: 'MAJOR',
          status: 'OPEN',
          effort: '30min',
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicalDebtService,
        {
          provide: getRepositoryToken(TechnicalDebt),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(CodeQualityMetrics),
          useValue: mockMetricsRepository,
        },
        {
          provide: SonarQubeService,
          useValue: mockSonarQubeService,
        },
      ],
    }).compile();

    service = module.get<TechnicalDebtService>(TechnicalDebtService);
    repository = module.get(getRepositoryToken(TechnicalDebt));
    metricsRepository = module.get(getRepositoryToken(CodeQualityMetrics));
    sonarQubeService = module.get(SonarQubeService);
  });

  describe('createTechnicalDebt', () => {
    it('should create a new technical debt item', async () => {
      const input = {
        category: 'code' as const,
        severity: 'high' as const,
        description: 'Test item',
        filePath: 'src/test.ts',
        estimatedHours: 4,
        status: 'identified' as const,
      };

      const result = await service.createTechnicalDebt(input);

      expect(repository.create).toHaveBeenCalledWith({
        category: 'code',
        severity: 'high',
        description: 'Test item',
        filePath: 'src/test.ts',
        estimatedHours: 4,
        status: 'identified',
        lineNumber: undefined,
        actualHours: undefined,
      });
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('getAllTechnicalDebt', () => {
    it('should return all debt items', async () => {
      const result = await service.getAllTechnicalDebt();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockDebtItem);
    });

    it('should filter by category', async () => {
      await service.getAllTechnicalDebt({ category: 'code' });

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'code' }),
        })
      );
    });
  });

  describe('getDebtSummary', () => {
    it('should return debt summary with correct calculations', async () => {
      const result = await service.getDebtSummary();

      expect(result).toHaveProperty('totalItems');
      expect(result).toHaveProperty('byCategory');
      expect(result).toHaveProperty('bySeverity');
      expect(result).toHaveProperty('byStatus');
      expect(result).toHaveProperty('reductionPercentage');
    });
  });

  describe('identifyDebtFromSonarQube', () => {
    it('should create debt items from SonarQube issues', async () => {
      const result = await service.identifyDebtFromSonarQube();

      expect(sonarQubeService.getIssues).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });
  });
});

describe('SecurityPatchService', () => {
  let service: SecurityPatchService;
  let patchRepository: jest.Mocked<Repository<SecurityPatch>>;
  let vulnerabilityRepository: jest.Mocked<Repository<SecurityVulnerability>>;

  beforeEach(async () => {
    const mockPatchRepository = {
      create: jest.fn().mockImplementation((data) => ({ id: 'patch-1', ...data })),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const mockVulnerabilityRepository = {
      create: jest.fn().mockImplementation((data) => ({ id: 'vuln-1', ...data })),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityPatchService,
        {
          provide: getRepositoryToken(SecurityPatch),
          useValue: mockPatchRepository,
        },
        {
          provide: getRepositoryToken(SecurityVulnerability),
          useValue: mockVulnerabilityRepository,
        },
      ],
    }).compile();

    service = module.get<SecurityPatchService>(SecurityPatchService);
    patchRepository = module.get(getRepositoryToken(SecurityPatch));
    vulnerabilityRepository = module.get(getRepositoryToken(SecurityVulnerability));
  });

  describe('scanForVulnerabilities', () => {
    it('should return vulnerability scan results', async () => {
      const result = await service.scanForVulnerabilities();

      expect(result).toHaveProperty('vulnerabilities');
      expect(result).toHaveProperty('scanTime');
      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('critical');
      expect(result.summary).toHaveProperty('high');
      expect(result.summary).toHaveProperty('medium');
      expect(result.summary).toHaveProperty('low');
    });
  });

  describe('deployPatch', () => {
    it('should deploy a patch successfully', async () => {
      patchRepository.findOne.mockResolvedValue({
        id: 'patch-1',
        vulnerabilityId: 'CVE-2024-1234',
        severity: 'critical',
        affectedSystems: ['api-service'],
        patchVersion: '1.0.1',
        status: 'available',
      } as SecurityPatch);

      const result = await service.deployPatch('patch-1');

      expect(result.success).toBe(true);
      expect(result.rollbackAvailable).toBe(true);
      expect(patchRepository.update).toHaveBeenCalled();
    });

    it('should fail when patch not found', async () => {
      patchRepository.findOne.mockResolvedValue(null);

      const result = await service.deployPatch('non-existent');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Patch not found');
    });
  });

  describe('checkCompliance', () => {
    it('should return compliance status', async () => {
      vulnerabilityRepository.find.mockResolvedValue([]);
      patchRepository.find.mockResolvedValue([]);

      const result = await service.checkCompliance();

      expect(result).toHaveProperty('compliant');
      expect(result).toHaveProperty('checks');
    });
  });
});

describe('InnovationSandboxService', () => {
  let service: InnovationSandboxService;
  let experimentRepository: jest.Mocked<Repository<InnovationExperiment>>;
  let featureFlagRepository: jest.Mocked<Repository<FeatureFlag>>;

  beforeEach(async () => {
    const mockExperimentRepository = {
      create: jest.fn().mockImplementation((data) => ({ id: 'exp-1', ...data })),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const mockFeatureFlagRepository = {
      create: jest.fn().mockImplementation((data) => ({ id: 'flag-1', ...data })),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InnovationSandboxService,
        {
          provide: getRepositoryToken(InnovationExperiment),
          useValue: mockExperimentRepository,
        },
        {
          provide: getRepositoryToken(FeatureFlag),
          useValue: mockFeatureFlagRepository,
        },
        {
          provide: getRepositoryToken(ExperimentParticipant),
          useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(UserFeedback),
          useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<InnovationSandboxService>(InnovationSandboxService);
    experimentRepository = module.get(getRepositoryToken(InnovationExperiment));
    featureFlagRepository = module.get(getRepositoryToken(FeatureFlag));
  });

  describe('createExperiment', () => {
    it('should create a new experiment', async () => {
      const input = {
        name: 'Test Experiment',
        description: 'Testing new feature',
        hypothesis: 'This will improve conversion',
        featureFlagKey: 'new-feature',
        metrics: { primary: 'conversion_rate' },
      };

      const result = await service.createExperiment(input);

      expect(experimentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Experiment',
          status: 'draft',
        })
      );
      expect(result).toHaveProperty('id');
    });
  });

  describe('createFeatureFlag', () => {
    it('should create a new feature flag', async () => {
      const input = {
        key: 'new-dashboard',
        name: 'New Dashboard',
        description: 'Enable new dashboard UI',
        rolloutPercentage: 50,
      };

      const result = await service.createFeatureFlag(input);

      expect(featureFlagRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'new-dashboard',
          isEnabled: false,
        })
      );
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return false when flag not found', async () => {
      featureFlagRepository.findOne.mockResolvedValue(null);

      const result = await service.isFeatureEnabled('non-existent');

      expect(result).toBe(false);
    });

    it('should return false when flag is disabled', async () => {
      featureFlagRepository.findOne.mockResolvedValue({
        id: 'flag-1',
        key: 'test-flag',
        isEnabled: false,
        rolloutPercentage: 100,
      } as FeatureFlag);

      const result = await service.isFeatureEnabled('test-flag');

      expect(result).toBe(false);
    });

    it('should return true when flag is enabled with 100% rollout', async () => {
      featureFlagRepository.findOne.mockResolvedValue({
        id: 'flag-1',
        key: 'test-flag',
        isEnabled: true,
        rolloutPercentage: 100,
      } as FeatureFlag);

      const result = await service.isFeatureEnabled('test-flag');

      expect(result).toBe(true);
    });
  });

  describe('assignVariant', () => {
    it('should return control for non-running experiments', async () => {
      experimentRepository.findOne.mockResolvedValue({
        id: 'exp-1',
        status: 'draft',
      } as InnovationExperiment);

      const result = await service.assignVariant('exp-1', 'user-1');

      expect(result).toBe('control');
    });
  });
});

describe('PerformanceOptimizationService', () => {
  let service: PerformanceOptimizationService;
  let snapshotRepository: jest.Mocked<Repository<PerformanceSnapshot>>;

  beforeEach(async () => {
    const mockSnapshotRepository = {
      create: jest.fn().mockImplementation((data) => ({ id: 'snap-1', ...data })),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      manager: { query: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceOptimizationService,
        {
          provide: getRepositoryToken(PerformanceSnapshot),
          useValue: mockSnapshotRepository,
        },
        {
          provide: getRepositoryToken(OptimizationRecommendation),
          useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn(), update: jest.fn() },
        },
        {
          provide: getRepositoryToken(LoadTestResult),
          useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(CacheMetrics),
          useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PerformanceOptimizationService>(PerformanceOptimizationService);
    snapshotRepository = module.get(getRepositoryToken(PerformanceSnapshot));
  });

  describe('getCurrentPerformance', () => {
    it('should return performance metrics', async () => {
      const result = await service.getCurrentPerformance('api-gateway');

      expect(result).toHaveProperty('cpuUsage');
      expect(result).toHaveProperty('memoryUsage');
      expect(result).toHaveProperty('latencyP50');
      expect(result).toHaveProperty('latencyP95');
      expect(result).toHaveProperty('latencyP99');
      expect(result).toHaveProperty('throughput');
      expect(result).toHaveProperty('errorRate');
      expect(result).toHaveProperty('apdexScore');
    });
  });

  describe('recordPerformanceSnapshot', () => {
    it('should create a performance snapshot', async () => {
      const input = {
        serviceName: 'api-gateway',
        metrics: { cpu: 45, memory: 62 },
        apmData: { traces: 1000 },
      };

      const result = await service.recordPerformanceSnapshot(input);

      expect(snapshotRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName: 'api-gateway',
        })
      );
    });
  });

  describe('runLoadTest', () => {
    it('should run a load test and return results', async () => {
      const config = {
        serviceName: 'api-gateway',
        vusers: 100,
        duration: 60,
        rampUp: 10,
      };

      const result = await service.runLoadTest(config);

      expect(result).toHaveProperty('testName');
      expect(result).toHaveProperty('vusers', 100);
      expect(result).toHaveProperty('duration', 60);
      expect(result).toHaveProperty('requestsPerSec');
      expect(result).toHaveProperty('avgLatency');
      expect(result).toHaveProperty('p95Latency');
      expect(result).toHaveProperty('status');
    });
  });
});

describe('DependencyUpdateService', () => {
  let service: DependencyUpdateService;
  let updateRepository: jest.Mocked<Repository<DependencyUpdate>>;

  beforeEach(async () => {
    const mockUpdateRepository = {
      create: jest.fn().mockImplementation((data) => ({ id: 'upd-1', ...data })),
      save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DependencyUpdateService,
        {
          provide: getRepositoryToken(DependencyUpdate),
          useValue: mockUpdateRepository,
        },
        {
          provide: getRepositoryToken(DependencyInventory),
          useValue: { find: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DependencyUpdateService>(DependencyUpdateService);
    updateRepository = module.get(getRepositoryToken(DependencyUpdate));
  });

  describe('scheduleUpdate', () => {
    it('should schedule a dependency update', async () => {
      const input = {
        packageName: 'axios',
        currentVersion: '0.21.1',
        latestVersion: '1.6.0',
      };

      const result = await service.scheduleUpdate(input);

      expect(updateRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          packageName: 'axios',
          currentVersion: '0.21.1',
          latestVersion: '1.6.0',
          status: 'pending',
        })
      );
    });
  });

  describe('applyUpdate', () => {
    it('should apply an update successfully', async () => {
      updateRepository.findOne.mockResolvedValue({
        id: 'upd-1',
        packageName: 'axios',
        currentVersion: '0.21.1',
        latestVersion: '1.6.0',
        status: 'approved',
      } as DependencyUpdate);

      const result = await service.applyUpdate('upd-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('axios');
      expect(updateRepository.update).toHaveBeenCalled();
    });

    it('should fail when update not found', async () => {
      updateRepository.findOne.mockResolvedValue(null);

      const result = await service.applyUpdate('non-existent');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Update not found');
    });
  });

  describe('rollbackUpdate', () => {
    it('should rollback an update', async () => {
      updateRepository.findOne.mockResolvedValue({
        id: 'upd-1',
        packageName: 'axios',
        currentVersion: '0.21.1',
      } as DependencyUpdate);

      const result = await service.rollbackUpdate('upd-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Rolled back');
    });
  });
});
