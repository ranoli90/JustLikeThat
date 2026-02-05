import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let prismaService: PrismaService;

  const mockPrisma = {
    complianceControl: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    dataSubjectRequest: {
      count: jest.fn(),
    },
    consentRecord: {
      count: jest.fn(),
    },
    pHIAccessLog: {
      count: jest.fn(),
    },
    businessAssociateAgreement: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getSOC2Controls', () => {
    it('should return SOC2 controls', async () => {
      const mockControls = [
        { id: '1', framework: 'SOC2', controlId: 'CC1.1', status: 'compliant' },
        { id: '2', framework: 'SOC2', controlId: 'CC2.1', status: 'partial' },
      ];

      mockPrisma.complianceControl.findMany.mockResolvedValue(mockControls);

      const result = await service.getSOC2Controls('tenant-1');

      expect(result).toEqual(mockControls);
      expect(mockPrisma.complianceControl.findMany).toHaveBeenCalledWith({
        where: { framework: 'SOC2' },
        orderBy: { controlId: 'asc' },
      });
    });
  });

  describe('createSOC2Control', () => {
    it('should create a new SOC2 control', async () => {
      const mockControl = {
        id: '1',
        framework: 'SOC2',
        controlId: 'CC1.1',
        name: 'Control Environment',
        description: 'Test description',
        implementation: 'Test implementation',
        testingProcedure: 'Test procedure',
        status: 'pending_review',
        riskLevel: 'medium',
      };

      mockPrisma.complianceControl.create.mockResolvedValue(mockControl);

      const result = await service.createSOC2Control({
        controlId: 'CC1.1',
        name: 'Control Environment',
        description: 'Test description',
        implementation: 'Test implementation',
        testingProcedure: 'Test procedure',
      });

      expect(result).toEqual(mockControl);
      expect(mockPrisma.complianceControl.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          framework: 'SOC2',
          controlId: 'CC1.1',
          status: 'pending_review',
          riskLevel: 'medium',
        }),
      });
    });
  });

  describe('getSOC2ComplianceScore', () => {
    it('should calculate compliance score correctly', async () => {
      mockPrisma.complianceControl.findMany.mockResolvedValue([
        { status: 'compliant' },
        { status: 'compliant' },
        { status: 'partial' },
        { status: 'non_compliant' },
      ]);

      const score = await service.getSOC2ComplianceScore('tenant-1');

      // (2*1 + 1*0.5 + 1*0) / 4 * 100 = 62.5
      expect(score).toBe(62);
    });

    it('should return 100 when no controls exist', async () => {
      mockPrisma.complianceControl.findMany.mockResolvedValue([]);

      const score = await service.getSOC2ComplianceScore('tenant-1');

      expect(score).toBe(100);
    });
  });

  describe('getGDPRCompliance', () => {
    it('should return GDPR compliance status', async () => {
      mockPrisma.dataSubjectRequest.count.mockResolvedValue(10);
      mockPrisma.consentRecord.count.mockResolvedValue(100);
      mockPrisma.complianceControl.findMany.mockResolvedValue([
        { status: 'compliant' },
        { status: 'compliant' },
      ]);

      const result = await service.getGDPRCompliance('tenant-1');

      expect(result.dsarAutomation).toBe(true);
      expect(result.dataPortability).toBe(true);
      expect(result.rightToErasure).toBe(true);
      expect(result.consentManagement).toBe(true);
      expect(result.dataMinimization).toBe(true);
    });
  });

  describe('getHIPAACompliance', () => {
    it('should return HIPAA compliance status', async () => {
      mockPrisma.pHIAccessLog.count.mockResolvedValue(50);
      mockPrisma.businessAssociateAgreement.count.mockResolvedValue(5);
      mockPrisma.complianceControl.findMany.mockResolvedValue([
        { status: 'compliant' },
      ]);

      const result = await service.getHIPAACompliance('tenant-1');

      expect(result.phiEncryption).toBe(true);
      expect(result.accessControls).toBe(true);
      expect(result.auditControls).toBe(true);
      expect(result.breachNotification).toBe(true);
      expect(result.baaManagement).toBe(true);
    });
  });

  describe('getOverallComplianceScore', () => {
    it('should return average of all framework scores', async () => {
      mockPrisma.complianceControl.findMany.mockResolvedValue([]);

      jest.spyOn(service, 'getSOC2ComplianceScore').mockResolvedValue(80);
      jest.spyOn(service, 'getGDPRComplianceScore').mockResolvedValue(90);
      jest.spyOn(service, 'getHIPAAComplianceScore').mockResolvedValue(70);

      const score = await service.getOverallComplianceScore('tenant-1');

      expect(score).toBe(80); // (80 + 90 + 70) / 3 = 80
    });
  });

  describe('getComplianceReport', () => {
    it('should return compliance report for specified framework', async () => {
      mockPrisma.complianceControl.findMany.mockResolvedValue([
        { id: '1', status: 'compliant' },
        { id: '2', status: 'partial' },
      ]);
      jest.spyOn(service, 'getSOC2ComplianceScore').mockResolvedValue(75);

      const result = await service.getComplianceReport('tenant-1', 'SOC2');

      expect(result.framework).toBe('SOC2');
      expect(result.controls).toHaveLength(2);
      expect(result.summary.compliant).toBe(1);
      expect(result.summary.partial).toBe(1);
    });
  });
});
