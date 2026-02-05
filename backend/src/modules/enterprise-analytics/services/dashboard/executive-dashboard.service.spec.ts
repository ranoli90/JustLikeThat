// Unit Tests for Executive Dashboard Service
// Sprint 45: Enterprise Analytics & Reporting

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutiveDashboardService } from './executive-dashboard.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('ExecutiveDashboardService', () => {
  let service: ExecutiveDashboardService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockDashboard = {
    id: 'test-dashboard-id',
    userId: 'user-123',
    tenantId: 'tenant-456',
    name: 'Test Dashboard',
    description: 'A test dashboard',
    layout: { columns: 12, rowHeight: 100 },
    widgets: [],
    isDefault: false,
    isPublic: false,
    refreshInterval: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      dashboardConfig: {
        create: jest.fn().mockResolvedValue(mockDashboard),
        findMany: jest.fn().mockResolvedValue([mockDashboard]),
        findUnique: jest.fn().mockResolvedValue(mockDashboard),
        update: jest.fn().mockResolvedValue({ ...mockDashboard, name: 'Updated Dashboard' }),
        delete: jest.fn().mockResolvedValue({ success: true }),
      },
      widgetTemplate: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      reportExport: {
        create: jest.fn().mockResolvedValue({ id: 'export-123', status: 'processing' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutiveDashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ExecutiveDashboardService>(ExecutiveDashboardService);
    prismaService = module.get(PrismaService);
  });

  describe('createDashboard', () => {
    it('should create a new dashboard', async () => {
      const result = await service.createDashboard('user-123', 'tenant-456', {
        name: 'Test Dashboard',
        description: 'A test dashboard',
      });

      expect(result).toEqual(mockDashboard);
      expect(prismaService.dashboardConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          tenantId: 'tenant-456',
          name: 'Test Dashboard',
          isDefault: false,
          isPublic: false,
          refreshInterval: 30,
        }),
      });
    });

    it('should set default values when not provided', async () => {
      const result = await service.createDashboard('user-123', 'tenant-456', {
        name: 'Minimal Dashboard',
      });

      expect(result.isDefault).toBe(false);
      expect(result.isPublic).toBe(false);
      expect(result.refreshInterval).toBe(30);
    });
  });

  describe('getDashboards', () => {
    it('should return dashboards for a user', async () => {
      const result = await service.getDashboards('user-123', 'tenant-456');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockDashboard);
      expect(prismaService.dashboardConfig.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ userId: 'user-123' }, { isPublic: true }],
          tenantId: 'tenant-456',
        },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('getDashboardById', () => {
    it('should return a dashboard by id', async () => {
      const result = await service.getDashboardById('test-dashboard-id', 'user-123', 'tenant-456');

      expect(result).toEqual(mockDashboard);
      expect(prismaService.dashboardConfig.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-dashboard-id' },
      });
    });

    it('should throw NotFoundException when dashboard not found', async () => {
      prismaService.dashboardConfig.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.getDashboardById('non-existent-id', 'user-123', 'tenant-456'),
      ).rejects.toThrow('Dashboard not found');
    });

    it('should throw ForbiddenException when user does not have access', async () => {
      await expect(
        service.getDashboardById('test-dashboard-id', 'other-user', 'tenant-456'),
      ).rejects.toThrow('Access denied to this dashboard');
    });
  });

  describe('updateDashboard', () => {
    it('should update a dashboard', async () => {
      const result = await service.updateDashboard('test-dashboard-id', 'user-123', {
        name: 'Updated Dashboard',
      });

      expect(result.name).toBe('Updated Dashboard');
      expect(prismaService.dashboardConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-dashboard-id' },
          data: expect.objectContaining({ name: 'Updated Dashboard' }),
        }),
      );
    });

    it('should throw ForbiddenException when updating another user dashboard', async () => {
      await expect(
        service.updateDashboard('test-dashboard-id', 'other-user', { name: 'Hacked' }),
      ).rejects.toThrow('Can only update your own dashboards');
    });
  });

  describe('deleteDashboard', () => {
    it('should delete a dashboard', async () => {
      const result = await service.deleteDashboard('test-dashboard-id', 'user-123');

      expect(result).toEqual({ success: true });
      expect(prismaService.dashboardConfig.delete).toHaveBeenCalledWith({
        where: { id: 'test-dashboard-id' },
      });
    });
  });

  describe('getKPIWidgets', () => {
    it('should return KPI widgets with correct structure', async () => {
      const kpis = await service.getKPIWidgets('tenant-456', { preset: 'this_month' });

      expect(Array.isArray(kpis)).toBe(true);
      expect(kpis.length).toBe(8);

      const firstKpi = kpis[0];
      expect(firstKpi).toHaveProperty('id');
      expect(firstKpi).toHaveProperty('title');
      expect(firstKpi).toHaveProperty('value');
      expect(firstKpi).toHaveProperty('format');
    });

    it('should include trend information', async () => {
      const kpis = await service.getKPIWidgets('tenant-456', { preset: 'this_month' });

      const kpiWithTrend = kpis.find((k: any) => k.previousValue !== undefined);
      expect(kpiWithTrend).toHaveProperty('change');
      expect(kpiWithTrend).toHaveProperty('changeType');
    });
  });

  describe('getWidgetLibrary', () => {
    it('should return widget library with 50+ widgets', async () => {
      const library = await service.getWidgetLibrary();

      expect(Array.isArray(library)).toBe(true);
      expect(library.length).toBeGreaterThanOrEqual(50);

      const widgetTypes = new Set(library.map((w: any) => w.type));
      expect(widgetTypes.size).toBeGreaterThan(1);
    });
  });

  describe('exportDashboard', () => {
    it('should create an export record', async () => {
      const result = await service.exportDashboard('test-dashboard-id', 'pdf');

      expect(result).toHaveProperty('exportId');
      expect(result).toHaveProperty('status', 'processing');
      expect(result).toHaveProperty('estimatedTime');
    });
  });

  describe('getDrillDownData', () => {
    it('should return drill-down data for applications widget', async () => {
      const data = await service.getDrillDownData('total-applications', 'tenant-456');

      expect(data).toHaveProperty('bySource');
      expect(data).toHaveProperty('byDepartment');
    });

    it('should return drill-down data for time-to-fill widget', async () => {
      const data = await service.getDrillDownData('time-to-fill', 'tenant-456');

      expect(data).toHaveProperty('byRole');
      expect(data).toHaveProperty('byDepartment');
    });

    it('should return drill-down data for cost widget', async () => {
      const data = await service.getDrillDownData('cost-per-hire', 'tenant-456');

      expect(data).toHaveProperty('byCategory');
      expect(data).toHaveProperty('total');
    });
  });

  describe('getAccessibleDashboards', () => {
    it('should return all public dashboards for admin', async () => {
      const result = await service.getAccessibleDashboards('user-123', 'tenant-456', 'admin');

      expect(result).toHaveLength(1);
    });

    it('should filter dashboards for regular users', async () => {
      await service.getAccessibleDashboards('user-123', 'tenant-456', 'user');

      expect(prismaService.dashboardConfig.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user-123',
        }),
      });
    });
  });
});
