import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from './dto/tenant.dto';
import { TenantStatus, PlanType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    // Check if slug or domain already exists
    const existing = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: createTenantDto.slug },
          { domain: createTenantDto.domain },
          { subdomain: createTenantDto.subdomain },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Tenant with this slug, domain, or subdomain already exists');
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: createTenantDto.name,
        slug: createTenantDto.slug,
        domain: createTenantDto.domain,
        subdomain: createTenantDto.subdomain,
        plan: createTenantDto.plan || PlanType.FREE,
        status: TenantStatus.ACTIVE,
        dataResidency: createTenantDto.dataResidency || 'US',
      },
      include: {
        branding: true,
      },
    });

    // Create default branding
    await this.prisma.tenantBranding.create({
      data: {
        tenantId: tenant.id,
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
      },
    });

    // Create default billing plan
    await this.prisma.billingPlan.create({
      data: {
        tenantId: tenant.id,
        name: 'Free',
        tier: 'FREE',
        basePrice: 0,
        billingCycle: 'MONTHLY',
        features: [],
        includedUsage: {},
        overageRates: {},
      },
    });

    return tenant;
  }

  async findAll(query: TenantQueryDto) {
    const { page = 1, limit = 20, status, plan, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (plan) where.plan = plan;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: {
          branding: true,
          _count: {
            select: { users: true, applications: true },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        branding: true,
        featureFlags: true,
        billingPlans: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        customDomains: true,
        webhooks: {
          where: { isActive: true },
        },
        integrations: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        branding: true,
        featureFlags: {
          where: { isEnabled: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }

    return tenant;
  }

  async findByDomain(domain: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [{ domain }, { subdomain: domain }],
      },
      include: {
        branding: true,
      },
    });

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    await this.findOne(id); // Verify exists

    // Check for conflicts if updating unique fields
    if (updateTenantDto.slug || updateTenantDto.domain || updateTenantDto.subdomain) {
      const orConditions: any[] = [];
      if (updateTenantDto.slug) orConditions.push({ slug: updateTenantDto.slug });
      if (updateTenantDto.domain) orConditions.push({ domain: updateTenantDto.domain });
      if (updateTenantDto.subdomain) orConditions.push({ subdomain: updateTenantDto.subdomain });

      const existing = await this.prisma.tenant.findFirst({
        where: {
          id: { not: id },
          OR: orConditions,
        },
      });

      if (existing) {
        throw new ConflictException('Tenant with this slug, domain, or subdomain already exists');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
      include: { branding: true },
    });
  }

  async updateStatus(id: string, status: TenantStatus) {
    await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { status },
    });
  }

  async updatePlan(id: string, plan: PlanType) {
    await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { plan },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    
    // Soft delete - update status to DELETED
    return this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.DELETED },
    });
  }

  async hardDelete(id: string) {
    // Only for GDPR compliance - actually deletes the tenant
    await this.findOne(id);
    await this.prisma.tenant.delete({ where: { id } });
    return { success: true };
  }

  async getTenantStats(id: string) {
    const tenant = await this.findOne(id);

    const [userCount, applicationCount, storageUsage, monthlyUsage] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: id } }),
      this.prisma.application.count({ where: { tenantId: id } }),
      this.prisma.resume.aggregate({
        where: { tenantId: id },
        _sum: { fileSize: true },
      }),
      this.getMonthlyUsage(id),
    ]);

    return {
      tenant,
      stats: {
        users: userCount,
        applications: applicationCount,
        storageUsed: storageUsage._sum.fileSize || 0,
        monthlyUsage,
      },
    };
  }

  private async getMonthlyUsage(tenantId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await this.prisma.tenantUsage.findMany({
      where: {
        tenantId,
        periodStart: { gte: startOfMonth },
      },
    });

    return usage.reduce((acc, u) => {
      acc[u.metricType] = (acc[u.metricType] || 0) + u.quantity;
      return acc;
    }, {});
  }

  async generateSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async getDefaultBranding(tenantId: string) {
    return this.prisma.tenantBranding.upsert({
      where: { tenantId },
      create: {
        tenantId,
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
      },
      update: {},
    });
  }
}
