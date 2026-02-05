// Sprint 50: Platform Maturity & Handover - Controller Tests

import { Test, TestingModule } from '@nestjs/testing';
import { DocumentationController } from '../controllers/maturity.controller';
import { TrainingController } from '../controllers/maturity.controller';
import { RunbookController } from '../controllers/maturity.controller';
import { ReleaseController } from '../controllers/maturity.controller';
import { QAController } from '../controllers/maturity.controller';
import { SignOffController } from '../controllers/maturity.controller';
import { MetricsController } from '../controllers/maturity.controller';
import { FAQController } from '../controllers/maturity.controller';
import { KnowledgeTransferController } from '../controllers/maturity.controller';
import { DocumentationService } from '../services/documentation.service';
import { TrainingService } from '../services/training.service';
import { RunbookService } from '../services/runbook.service';
import { ReleaseManagementService } from '../services/release-management.service';
import { QualityAssuranceService } from '../services/quality-assurance.service';
import { SignOffService } from '../services/sign-off.service';
import { PlatformMetricsService } from '../services/platform-metrics.service';
import { FAQService } from '../services/faq.service';
import { KnowledgeTransferService } from '../services/knowledge-transfer.service';

describe('Maturity Controllers', () => {
  describe('DocumentationController', () => {
    let controller: DocumentationController;
    let service: DocumentationService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [DocumentationController],
        providers: [DocumentationService],
      }).compile();

      controller = module.get<DocumentationController>(DocumentationController);
      service = module.get<DocumentationService>(DocumentationService);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should create documentation', () => {
      const dto = {
        category: 'api',
        title: 'Test API Docs',
        content: 'Test content',
        version: '1.0.0',
        author: 'Test Author',
      };

      const result = controller.create(dto);
      expect(result).toBeDefined();
      expect(result.category).toBe('api');
    });

    it('should get all documentation', () => {
      const result = controller.findAll({ page: 1, limit: 10 });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
    });

    it('should get documentation stats', () => {
      const stats = controller.getStats();
      expect(stats).toHaveProperty('total');
    });
  });

  describe('TrainingController', () => {
    let controller: TrainingController;
    let service: TrainingService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [TrainingController],
        providers: [TrainingService],
      }).compile();

      controller = module.get<TrainingController>(TrainingController);
      service = module.get<TrainingService>(TrainingService);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should create training material', () => {
      const dto = {
        type: 'video' as const,
        title: 'Test Video',
        description: 'Test description',
        content: { url: 'https://example.com/video' },
        duration: 30,
        difficulty: 'beginner' as const,
        category: 'onboarding',
      };

      const result = controller.createMaterial(dto);
      expect(result).toBeDefined();
      expect(result.type).toBe('video');
    });
  });

  describe('RunbookController', () => {
    let controller: RunbookController;
    let service: RunbookService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [RunbookController],
        providers: [RunbookService],
      }).compile();

      controller = module.get<RunbookController>(RunbookController);
      service = module.get<RunbookService>(RunbookService);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should create runbook', async () => {
      const dto = {
        category: 'incident' as const,
        title: 'Incident Response',
        content: 'Runbook content',
        version: '1.0.0',
        author: 'Ops Team',
        priority: 'high' as const,
      };

      const result = await controller.create(dto);
      expect(result).toBeDefined();
      expect(result.category).toBe('incident');
    });

    it('should get runbook stats', async () => {
      const stats = await controller.getStats();
      expect(stats).toHaveProperty('total');
    });
  });

  describe('ReleaseController', () => {
    let controller: ReleaseController;
    let service: ReleaseManagementService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [ReleaseController],
        providers: [ReleaseManagementService],
      }).compile();

      controller = module.get<ReleaseController>(ReleaseController);
      service = module.get<ReleaseManagementService>(ReleaseManagementService);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should create release plan', () => {
      const dto = {
        version: '2.0.0',
        name: 'Spring Release',
        description: 'Major release',
        scheduledDate: new Date('2024-04-01'),
        riskLevel: 'medium' as const,
        changelog: [{ feature: 'New feature' }],
        rollbackPlan: 'Database backup',
      };

      const result = controller.create(dto);
      expect(result).toBeDefined();
      expect(result.version).toBe('2.0.0');
    });
  });

  describe('QAController', () => {
    let controller: QAController;
    let service: QualityAssuranceService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [QAController],
        providers: [QualityAssuranceService],
      }).compile();

      controller = module.get<QAController>(QAController);
      service = module.get<QualityAssuranceService>(QualityAssuranceService);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should create QA report', () => {
      const dto = {
        releaseId: 'release-123',
        testType: 'functional' as const,
        status: 'passed' as const,
        coverage: 85.5,
        executedBy: 'QA Team',
        executedAt: new Date(),
        issues: [],
        environment: 'staging',
      };

      const result = controller.createReport(dto);
      expect(result).toBeDefined();
      expect(result.testType).toBe('functional');
    });
  });

  describe('SignOffController', () => {
    let controller: SignOffController;
    let service: SignOffService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [SignOffController],
        providers: [SignOffService],
      }).compile();

      controller = module.get<SignOffController>(SignOffController);
      service = module.get<SignOffService>(SignOffService);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should create sign-off', () => {
      const dto = {
        stakeholderType: 'security' as const,
        stakeholderId: 'security-lead',
        stakeholderName: 'Security Lead',
        area: 'security' as const,
      };

      const result = controller.create(dto);
      expect(result).toBeDefined();
      expect(result.stakeholderType).toBe('security');
    });

    it('should get overall status', () => {
      const status = controller.getOverallStatus();
      expect(status).toBeDefined();
    });
  });

  describe('MetricsController', () => {
    let controller: MetricsController;
    let service: PlatformMetricsService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [MetricsController],
        providers: [PlatformMetricsService],
      }).compile();

      controller = module.get<MetricsController>(MetricsController);
      service = module.get<PlatformMetricsService>(PlatformMetricsService);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should create metrics', () => {
      const dto = {
        uptime: 99.99,
        performance: 92.5,
        security: 98.0,
        userSatisfaction: 88.5,
        costEfficiency: 85.0,
      };

      const result = controller.create(dto);
      expect(result).toBeDefined();
      expect(result.uptime).toBe(99.99);
    });

    it('should get health status', () => {
      const health = controller.getHealthStatus();
      expect(health).toBeDefined();
    });
  });

  describe('FAQController', () => {
    let controller: FAQController;
    let service: FAQService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [FAQController],
        providers: [FAQService],
      }).compile();

      controller = module.get<FAQController>(FAQController);
      service = module.get<FAQService>(FAQService);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should create FAQ', () => {
      const dto = {
        question: 'How do I reset password?',
        answer: 'Go to settings.',
        category: 'account',
        keywords: ['password', 'reset'],
      };

      const result = controller.create(dto);
      expect(result).toBeDefined();
      expect(result.question).toBe('How do I reset password?');
    });

    it('should search FAQs', () => {
      const results = controller.search('password', 10);
      expect(results).toBeDefined();
    });
  });

  describe('KnowledgeTransferController', () => {
    let controller: KnowledgeTransferController;
    let service: KnowledgeTransferService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [KnowledgeTransferController],
        providers: [KnowledgeTransferService],
      }).compile();

      controller = module.get<KnowledgeTransferController>(KnowledgeTransferController);
      service = module.get<KnowledgeTransferService>(KnowledgeTransferService);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should create knowledge transfer', () => {
      const dto = {
        type: 'workshop' as const,
        title: 'API Workshop',
        description: 'Hands-on workshop',
        targetAudience: ['developers'],
        objectives: ['Learn APIs'],
        duration: 120,
      };

      const result = controller.create(dto);
      expect(result).toBeDefined();
      expect(result.type).toBe('workshop');
    });

    it('should get upcoming sessions', () => {
      const sessions = controller.getUpcoming(5);
      expect(sessions).toBeDefined();
    });
  });
});
