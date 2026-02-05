// ============ ENTERPRISE INTEGRATIONS UNIT TESTS ============

import { Test, TestingModule } from '@nestjs/testing';
import { ERPIntegrationService, ERPConfig } from './erp-integration.service';
import { CRMIntegrationService, CRMConfig } from './crm-integration.service';
import { CorporateLMSService, LMSConfig } from './corporate-lms.service';
import { TalentManagementService } from './talent-management.service';
import { EnterpriseAPIGatewayService, APIRateLimit } from './enterprise-api-gateway.service';
import { LegacyIntegrationFramework, LegacySystemConfig } from './legacy-integration.framework';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption.service';

// Mock dependencies
const mockPrisma = {
  eRPConnection: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  cRMConnection: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  corporateLMSConnection: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  talentManagementSync: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  enterpriseAPIConfig: {
    upsert: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  legacySystemConnection: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  dataSyncLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
};

const mockEncryptionService = {
  encrypt: jest.fn().mockResolvedValue('encrypted-value'),
  decrypt: jest.fn().mockResolvedValue('decrypted-value'),
};

describe('ERPIntegrationService', () => {
  let service: ERPIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ERPIntegrationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<ERPIntegrationService>(ERPIntegrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connectToSAP', () => {
    it('should successfully connect to SAP', async () => {
      const config: ERPConfig = {
        provider: 'sap',
        baseUrl: 'https://api.sap.com',
        authType: 'oauth2',
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-secret',
        },
        syncSettings: {
          frequency: 'hourly',
          entities: ['financials', 'orgstructure'],
        },
      };

      mockPrisma.eRPConnection.create.mockResolvedValue({
        id: 'erp-123',
        tenantId: 'tenant-1',
        provider: 'sap',
        status: 'active',
      });

      const result = await service.connectToSAP('tenant-1', config);

      expect(result.success).toBe(true);
      expect(result.connectionId).toBe('erp-123');
      expect(mockEncryptionService.encrypt).toHaveBeenCalled();
    });

    it('should handle connection failure', async () => {
      const config: ERPConfig = {
        provider: 'sap',
        baseUrl: 'https://invalid-sap.com',
        authType: 'oauth2',
        credentials: {},
        syncSettings: {
          frequency: 'hourly',
          entities: [],
        },
      };

      mockPrisma.eRPConnection.create.mockRejectedValue(new Error('Connection refused'));

      const result = await service.connectToSAP('tenant-1', config);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('syncSAPFinancialData', () => {
    it('should sync financial data successfully', async () => {
      mockPrisma.eRPConnection.findUnique.mockResolvedValue({
        id: 'erp-123',
        provider: 'sap',
        tenantId: 'tenant-1',
      });

      mockPrisma.eRPConnection.update.mockResolvedValue({});
      mockPrisma.dataSyncLog.create.mockResolvedValue({});

      const result = await service.syncSAPFinancialData('erp-123');

      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should return error for invalid connection', async () => {
      mockPrisma.eRPConnection.findUnique.mockResolvedValue(null);

      const result = await service.syncSAPFinancialData('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid SAP connection');
    });
  });
});

describe('CRMIntegrationService', () => {
  let service: CRMIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CRMIntegrationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<CRMIntegrationService>(CRMIntegrationService);
  });

  describe('connectToSalesforce', () => {
    it('should successfully connect to Salesforce', async () => {
      const config: CRMConfig = {
        provider: 'salesforce',
        baseUrl: 'https://api.salesforce.com',
        authType: 'oauth2',
        credentials: {
          clientId: 'sf-client-id',
          clientSecret: 'sf-secret',
        },
        syncSettings: {
          frequency: 'realtime',
          entities: ['contacts', 'opportunities'],
        },
      };

      mockPrisma.cRMConnection.create.mockResolvedValue({
        id: 'crm-123',
        tenantId: 'tenant-1',
        provider: 'salesforce',
        status: 'active',
      });

      const result = await service.connectToSalesforce('tenant-1', config);

      expect(result.success).toBe(true);
      expect(result.connectionId).toBe('crm-123');
    });
  });

  describe('syncSalesforceContacts', () => {
    it('should sync contacts successfully', async () => {
      mockPrisma.cRMConnection.findUnique.mockResolvedValue({
        id: 'crm-123',
        provider: 'salesforce',
        tenantId: 'tenant-1',
      });

      mockPrisma.cRMConnection.update.mockResolvedValue({});

      const result = await service.syncSalesforceContacts('crm-123');

      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('CorporateLMSService', () => {
  let service: CorporateLMSService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorporateLMSService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<CorporateLMSService>(CorporateLMSService);
  });

  describe('connectToWorkdayLearning', () => {
    it('should successfully connect to Workday Learning', async () => {
      const config: LMSConfig = {
        provider: 'workday',
        baseUrl: 'https://api.workday.com',
        authType: 'oauth2',
        credentials: {
          clientId: 'wd-client-id',
          clientSecret: 'wd-secret',
        },
        syncSettings: {
          frequency: 'hourly',
          entities: ['courses', 'enrollments'],
        },
      };

      mockPrisma.corporateLMSConnection.create.mockResolvedValue({
        id: 'lms-123',
        tenantId: 'tenant-1',
        provider: 'workday',
        status: 'active',
      });

      const result = await service.connectToWorkdayLearning('tenant-1', config);

      expect(result.success).toBe(true);
      expect(result.connectionId).toBe('lms-123');
    });
  });
});

describe('TalentManagementService', () => {
  let service: TalentManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TalentManagementService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<TalentManagementService>(TalentManagementService);
  });

  describe('syncSuccessionPlans', () => {
    it('should sync succession plans successfully', async () => {
      mockPrisma.talentManagementSync.create.mockResolvedValue({});

      const result = await service.syncSuccessionPlans('tenant-1');

      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('syncPerformanceReviews', () => {
    it('should sync performance reviews successfully', async () => {
      mockPrisma.talentManagementSync.create.mockResolvedValue({});

      const result = await service.syncPerformanceReviews('tenant-1');

      expect(result.success).toBe(true);
    });
  });
});

describe('EnterpriseAPIGatewayService', () => {
  let service: EnterpriseAPIGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnterpriseAPIGatewayService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<EnterpriseAPIGatewayService>(EnterpriseAPIGatewayService);
  });

  describe('configureRateLimit', () => {
    it('should configure rate limit successfully', async () => {
      const rateLimit: APIRateLimit = {
        requestsPerMinute: 1000,
        requestsPerHour: 10000,
        requestsPerDay: 100000,
        burstSize: 100,
      };

      mockPrisma.enterpriseAPIConfig.upsert.mockResolvedValue({
        id: 'config-123',
        tenantId: 'tenant-1',
      });

      const result = await service.configureRateLimit('tenant-1', rateLimit);

      expect(result.success).toBe(true);
      expect(result.configId).toBe('config-123');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow request within rate limit', async () => {
      const result = await service.checkRateLimit('tenant-1', '/api/test', 'api-key-1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });
  });
});

describe('LegacyIntegrationFramework', () => {
  let service: LegacyIntegrationFramework;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegacyIntegrationFramework,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<LegacyIntegrationFramework>(LegacyIntegrationFramework);
  });

  describe('connectToLegacySystem', () => {
    it('should successfully connect to legacy system', async () => {
      const config: LegacySystemConfig = {
        systemName: 'Mainframe System',
        protocol: 'sftp',
        host: 'mainframe.company.com',
        port: 22,
        username: 'admin',
        mappings: [],
        batchSize: 1000,
        retryAttempts: 3,
        timeout: 30000,
      };

      mockPrisma.legacySystemConnection.create.mockResolvedValue({
        id: 'legacy-123',
        tenantId: 'tenant-1',
        systemName: 'Mainframe System',
        status: 'active',
      });

      const result = await service.connectToLegacySystem('tenant-1', config);

      expect(result.success).toBe(true);
      expect(result.connectionId).toBe('legacy-123');
    });
  });
});
