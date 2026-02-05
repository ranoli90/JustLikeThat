import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prismaService: PrismaService;

  const mockPrisma = {
    securityAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      const mockLog = {
        id: 'log-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        action: 'LOGIN',
        resource: 'auth',
        resourceId: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: {},
        riskLevel: 'low',
        createdAt: new Date(),
      };

      mockPrisma.securityAuditLog.create.mockResolvedValue(mockLog);

      const result = await service.log({
        userId: 'user-1',
        tenantId: 'tenant-1',
        action: 'LOGIN',
        resource: 'auth',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: {},
        riskLevel: 'low',
      });

      expect(result).toEqual(mockLog);
      expect(mockPrisma.securityAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          tenantId: 'tenant-1',
          action: 'LOGIN',
          resource: 'auth',
          riskLevel: 'low',
        }),
      });
    });

    it('should use default risk level when not provided', async () => {
      const mockLog = {
        id: 'log-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        action: 'VIEW',
        resource: 'page',
        ipAddress: '192.168.1.1',
        riskLevel: 'low',
        createdAt: new Date(),
      };

      mockPrisma.securityAuditLog.create.mockResolvedValue(mockLog);

      await service.log({
        tenantId: 'tenant-1',
        action: 'VIEW',
        resource: 'page',
        ipAddress: '192.168.1.1',
      });

      expect(mockPrisma.securityAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          riskLevel: 'low',
        }),
      });
    });
  });

  describe('getAuditLogs', () => {
    it('should return filtered audit logs with pagination', async () => {
      const mockLogs = [
        { id: 'log-1', action: 'LOGIN', createdAt: new Date() },
        { id: 'log-2', action: 'LOGOUT', createdAt: new Date() },
      ];

      mockPrisma.securityAuditLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.securityAuditLog.count.mockResolvedValue(2);

      const result = await service.getAuditLogs({
        tenantId: 'tenant-1',
        action: 'LOGIN',
        limit: 10,
        offset: 0,
      });

      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(2);
      expect(mockPrisma.securityAuditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          action: { contains: 'LOGIN', mode: 'insensitive' },
        }),
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });

    it('should return all logs when no filters applied', async () => {
      mockPrisma.securityAuditLog.findMany.mockResolvedValue([]);
      mockPrisma.securityAuditLog.count.mockResolvedValue(0);

      await service.getAuditLogs({
        tenantId: 'tenant-1',
      });

      expect(mockPrisma.securityAuditLog.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { createdAt: 'desc' },
        take: 100,
        skip: 0,
      });
    });
  });

  describe('getAuditLog', () => {
    it('should return a specific audit log', async () => {
      const mockLog = { id: 'log-1', action: 'LOGIN' };
      mockPrisma.securityAuditLog.findUnique.mockResolvedValue(mockLog);

      const result = await service.getAuditLog('log-1');

      expect(result).toEqual(mockLog);
      expect(mockPrisma.securityAuditLog.findUnique).toHaveBeenCalledWith({
        where: { id: 'log-1' },
      });
    });
  });

  describe('exportAuditLogs', () => {
    it('should export logs within date range', async () => {
      const mockLogs = [
        { id: 'log-1', action: 'LOGIN', createdAt: new Date() },
      ];

      mockPrisma.securityAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.exportAuditLogs(
        'tenant-1',
        '2024-01-01',
        '2024-12-31',
      );

      expect(result.data).toEqual(mockLogs);
      expect(result.exportedAt).toBeDefined();
      expect(mockPrisma.securityAuditLog.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31'),
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('getAuditStatistics', () => {
    it('should return audit statistics', async () => {
      const mockLogs = [
        { action: 'LOGIN', resource: 'auth', riskLevel: 'low', createdAt: new Date(), userId: 'user-1' },
        { action: 'LOGOUT', resource: 'auth', riskLevel: 'low', createdAt: new Date(), userId: 'user-2' },
        { action: 'DELETE', resource: 'data', riskLevel: 'high', createdAt: new Date(), userId: 'user-1' },
      ];

      mockPrisma.securityAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getAuditStatistics('tenant-1', 30);

      expect(result.byAction).toEqual({
        LOGIN: 1,
        LOGOUT: 1,
        DELETE: 1,
      });
      expect(result.byResource).toEqual({
        auth: 2,
        data: 1,
      });
      expect(result.byRiskLevel).toEqual({
        low: 2,
        high: 1,
      });
      expect(result.totalLogs).toBe(3);
    });
  });

  describe('getHighRiskLogs', () => {
    it('should return high and critical risk logs', async () => {
      const mockLogs = [
        { id: 'log-1', riskLevel: 'critical', action: 'UNAUTHORIZED_ACCESS' },
        { id: 'log-2', riskLevel: 'high', action: 'SENSITIVE_DATA_ACCESS' },
      ];

      mockPrisma.securityAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getHighRiskLogs('tenant-1', 100);

      expect(result).toEqual(mockLogs);
      expect(mockPrisma.securityAuditLog.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          riskLevel: { in: ['high', 'critical'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  });
});
