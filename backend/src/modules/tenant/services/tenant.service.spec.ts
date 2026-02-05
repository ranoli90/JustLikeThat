import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from './tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('TenantService', () => {
  let service: TenantService;
  let prisma: jest.Mocked<PrismaService>;

  const mockTenant = {
    id: 'test-tenant-id',
    name: 'Test Tenant',
    slug: 'test-tenant',
    domain: null,
    subdomain: 'test',
    plan: 'FREE',
    status: 'ACTIVE',
    dataResidency: 'US',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    tenant: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    tenantBranding: {
      create: jest.fn(),
      upsert: jest.fn(),
    },
    billingPlan: {
      create: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    application: {
      count: jest.fn(),
    },
    resume: {
      aggregate: jest.fn(),
    },
    tenantUsage: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    prisma = module.get(PrismaService);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new tenant successfully', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);
      mockPrisma.tenantBranding.create.mockResolvedValue({ tenantId: mockTenant.id });
      mockPrisma.billingPlan.create.mockResolvedValue({ tenantId: mockTenant.id });

      const result = await service.create({
        name: 'Test Tenant',
        slug: 'test-tenant',
      });

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.findFirst).toHaveBeenCalled();
      expect(mockPrisma.tenant.create).toHaveBeenCalled();
      expect(mockPrisma.tenantBranding.create).toHaveBeenCalled();
      expect(mockPrisma.billingPlan.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug exists', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue(mockTenant);

      await expect(
        service.create({
          name: 'Test Tenant',
          slug: 'test-tenant',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return tenant by ID', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findOne('test-tenant-id');

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-tenant-id' },
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated tenants', async () => {
      const mockTenants = [mockTenant];
      mockPrisma.tenant.findMany.mockResolvedValue(mockTenants);
      mockPrisma.tenant.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(mockTenants);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([]);
      mockPrisma.tenant.count.mockResolvedValue(0);

      await service.findAll({ status: 'ACTIVE' });

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
        }),
      );
    });
  });

  describe('update', () => {
    it('should update tenant successfully', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      mockPrisma.tenant.findFirst.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({ ...mockTenant, name: 'Updated Tenant' });
      mockPrisma.tenant.update.mockResolvedValue({ ...mockTenant, name: 'Updated Tenant' });

      const result = await service.update('test-tenant-id', { name: 'Updated Tenant' });

      expect(result.name).toBe('Updated Tenant');
    });
  });

  describe('updateStatus', () => {
    it('should update tenant status', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.tenant.update.mockResolvedValue({ ...mockTenant, status: 'SUSPENDED' });

      const result = await service.updateStatus('test-tenant-id', 'SUSPENDED');

      expect(result.status).toBe('SUSPENDED');
    });
  });

  describe('delete', () => {
    it('should soft delete tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.tenant.update.mockResolvedValue({ ...mockTenant, status: 'DELETED' });

      await service.delete('test-tenant-id');

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'test-tenant-id' },
        data: { status: 'DELETED' },
      });
    });
  });

  describe('generateSlug', () => {
    it('should generate unique slug', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const slug = await service.generateSlug('Test Company');

      expect(slug).toBe('test-company');
    });

    it('should append number if slug exists', async () => {
      mockPrisma.tenant.findUnique
        .mockResolvedValueOnce(mockTenant) // test-company exists
        .mockResolvedValueOnce(null); // test-company-1 doesn't exist

      const slug = await service.generateSlug('Test Company');

      expect(slug).toBe('test-company-1');
    });
  });
});
