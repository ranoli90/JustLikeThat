import { Test, TestingModule } from '@nestjs/testing';
import { IncidentResponseService } from './incident-response.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

describe('IncidentResponseService', () => {
  let service: IncidentResponseService;
  let prismaService: PrismaService;
  let auditService: AuditService;

  const mockPrisma = {
    securityIncident: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentResponseService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<IncidentResponseService>(IncidentResponseService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('getIncidents', () => {
    it('should return filtered incidents', async () => {
      const mockIncidents = [
        { id: '1', title: 'Incident 1', status: 'open' },
        { id: '2', title: 'Incident 2', status: 'resolved' },
      ];

      mockPrisma.securityIncident.findMany.mockResolvedValue(mockIncidents);

      const result = await service.getIncidents('tenant-1', { status: 'open' });

      expect(result).toEqual(mockIncidents);
      expect(mockPrisma.securityIncident.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', status: 'open' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  });

  describe('getIncident', () => {
    it('should return a specific incident', async () => {
      const mockIncident = { id: '1', title: 'Test Incident' };
      mockPrisma.securityIncident.findUnique.mockResolvedValue(mockIncident);

      const result = await service.getIncident('1');

      expect(result).toEqual(mockIncident);
      expect(mockPrisma.securityIncident.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('reportIncident', () => {
    it('should create a new incident and log it', async () => {
      const mockIncident = {
        id: 'incident-1',
        title: 'Test Incident',
        description: 'Test description',
        severity: 'high',
        status: 'open',
        category: 'Data Breach',
      };

      mockPrisma.securityIncident.create.mockResolvedValue(mockIncident);
      mockAuditService.log.mockResolvedValue({});

      const result = await service.reportIncident('tenant-1', {
        title: 'Test Incident',
        description: 'Test description',
        severity: 'high',
        category: 'Data Breach',
        reportedBy: 'user-1',
        ipAddress: '192.168.1.1',
      });

      expect(result).toEqual(mockIncident);
      expect(mockPrisma.securityIncident.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'INCIDENT_REPORTED',
        }),
      );
    });
  });

  describe('updateIncidentStatus', () => {
    it('should update incident status and add timeline entry', async () => {
      const mockIncident = {
        id: '1',
        status: 'contained',
        updatedAt: new Date(),
        timeline: [],
      };

      mockPrisma.securityIncident.update.mockResolvedValue(mockIncident);

      const result = await service.updateIncidentStatus(
        '1',
        'contained',
        'user-1',
        'Containment actions applied',
      );

      expect(result).toEqual(mockIncident);
      expect(mockPrisma.securityIncident.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          status: 'contained',
          updatedAt: expect.any(Date),
          timeline: {
            push: expect.arrayContaining([
              expect.objectContaining({
                action: 'Status changed to contained',
                performedBy: 'user-1',
              }),
            ]),
          },
        }),
      });
    });

    it('should set resolvedAt when status is resolved', async () => {
      const mockIncident = { id: '1', status: 'resolved', resolvedAt: new Date() };
      mockPrisma.securityIncident.update.mockResolvedValue(mockIncident);

      await service.updateIncidentStatus('1', 'resolved', 'user-1');

      expect(mockPrisma.securityIncident.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          status: 'resolved',
          resolvedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('getOpenIncidentsCount', () => {
    it('should return count of open incidents', async () => {
      mockPrisma.securityIncident.count.mockResolvedValue(5);

      const count = await service.getOpenIncidentsCount('tenant-1');

      expect(count).toBe(5);
      expect(mockPrisma.securityIncident.count).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          status: { in: ['open', 'investigating', 'contained'] },
        },
      });
    });
  });

  describe('resolveIncident', () => {
    it('should resolve incident with resolution and root cause', async () => {
      const mockIncident = {
        id: '1',
        status: 'resolved',
        resolution: 'Issue fixed',
        rootCause: 'Configuration error',
      };

      mockPrisma.securityIncident.update.mockResolvedValue(mockIncident);

      const result = await service.resolveIncident(
        '1',
        'Issue fixed',
        'Configuration error',
        'user-1',
      );

      expect(result).toEqual(mockIncident);
    });
  });

  describe('getIncidentStatistics', () => {
    it('should return incident statistics', async () => {
      mockPrisma.securityIncident.findMany.mockResolvedValue([
        { severity: 'critical', status: 'open', category: 'Data Breach', createdAt: new Date(), resolvedAt: null },
        { severity: 'high', status: 'resolved', category: 'Unauthorized Access', createdAt: new Date(Date.now() - 86400000), resolvedAt: new Date() },
        { severity: 'medium', status: 'open', category: 'Malware', createdAt: new Date(Date.now() - 172800000), resolvedAt: null },
      ]);

      const result = await service.getIncidentStatistics('tenant-1', 30);

      expect(result.bySeverity).toEqual({
        critical: 1,
        high: 1,
        medium: 1,
      });
      expect(result.incidentsLast30Days).toBe(3);
    });
  });

  describe('autoContainIncident', () => {
    it('should perform containment actions', async () => {
      const mockIncident = { id: '1', status: 'open' };
      mockPrisma.securityIncident.findUnique.mockResolvedValue(mockIncident);
      mockPrisma.securityIncident.update.mockResolvedValue({
        ...mockIncident,
        status: 'contained',
      });

      const result = await service.autoContainIncident('1', [
        'block_ip',
        'alert_team',
      ]);

      expect(result.status).toBe('contained');
      expect(result.actions).toContain('IP address blocked');
      expect(result.actions).toContain('Security team alerted');
    });

    it('should return null for non-existent incident', async () => {
      mockPrisma.securityIncident.findUnique.mockResolvedValue(null);

      const result = await service.autoContainIncident('999', ['block_ip']);

      expect(result).toBeNull();
    });
  });
});
