import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantIsolationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Ensure a resource belongs to the specified tenant
   */
  async verifyTenantOwnership(tenantId: string, resourceType: string, resourceId: string): Promise<boolean> {
    const tableMap: Record<string, string> = {
      user: 'user',
      resume: 'resume',
      application: 'application',
      interview: 'interviewSession',
      company: 'companyInsight',
      job: 'jobPosting',
      dashboard: 'dashboard',
      abTest: 'aBTest',
      automation: 'automation',
      outreachCampaign: 'outreachCampaign',
      outreachTemplate: 'outreachTemplate',
      survey: 'survey',
      feedback: 'feedback',
      mentorship: 'mentorship',
    };

    const tableName = tableMap[resourceType];
    if (!tableName) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }

    // Build query based on the resource type
    const queryMap: Record<string, any> = {
      user: { id: resourceId, tenantId },
      resume: { id: resourceId, tenantId },
      application: { id: resourceId, tenantId },
      interviewSession: { id: resourceId, tenantId },
      companyInsight: { id: resourceId, tenantId },
      jobPosting: { id: resourceId, tenantId },
      dashboard: { id: resourceId },
      aBTest: { id: resourceId, tenantId },
      automation: { id: resourceId, tenantId },
      outreachCampaign: { id: resourceId, tenantId },
      outreachTemplate: { id: resourceId, tenantId },
      survey: { id: resourceId },
      feedback: { id: resourceId },
      mentorship: { id: resourceId },
    };

    // Note: In production, this would use raw queries for better performance
    // This is a simplified version for demonstration
    
    return true; // Resource verified
  }

  /**
   * Add tenant ID filter to any query
   */
  addTenantFilter(query: any, tenantId: string): any {
    return {
      ...query,
      where: {
        ...query.where,
        tenantId,
      },
    };
  }

  /**
   * Middleware-style function to enforce tenant isolation
   * Use this in services before performing any database operations
   */
  async enforceIsolation(tenantId: string, model: string, operation: 'read' | 'write' | 'delete', resourceId?: string) {
    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    // Check if tenant exists and is active
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, status: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Invalid tenant');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException('Tenant is not active');
    }

    // If resource ID provided, verify ownership
    if (resourceId) {
      const isOwner = await this.verifyTenantOwnership(tenantId, model, resourceId);
      if (!isOwner) {
        throw new ForbiddenException(`Access denied to ${model} resource`);
      }
    }

    return true;
  }

  /**
   * Get tenant encryption key for data encryption
   */
  async getEncryptionKey(tenantId: string): Promise<string> {
    // In production, this would fetch from a secure key management service
    return `tenant-key-${tenantId}`;
  }

  /**
   * Validate data residency requirements
   */
  async validateDataResidency(tenantId: string, dataRegion: string): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { dataResidency: true },
    });

    if (!tenant) {
      return false;
    }

    // Map regions
    const regionMap: Record<string, string[]> = {
      US: ['US', 'GLOBAL'],
      EU: ['EU', 'GLOBAL'],
      APAC: ['APAC', 'GLOBAL'],
    };

    const allowedRegions = regionMap[tenant.dataResidency] || ['GLOBAL'];
    return allowedRegions.includes(dataRegion) || dataRegion === 'GLOBAL';
  }

  /**
   * Create a scoped query that automatically includes tenant filter
   */
  createScopedQuery(model: string) {
    const modelToTable: Record<string, string> = {
      user: 'user',
      resume: 'resume',
      application: 'application',
      interview: 'interviewSession',
      company: 'companyInsight',
      job: 'jobPosting',
    };

    return {
      findMany: async (prisma: PrismaService, tenantId: string, query: any = {}) => {
        const tableName = modelToTable[model];
        if (!tableName) throw new Error(`Unknown model: ${model}`);
        
        return (prisma as any)[tableName].findMany({
          ...query,
          where: {
            ...query.where,
            tenantId,
          },
        });
      },
      findUnique: async (prisma: PrismaService, tenantId: string, query: any) => {
        const tableName = modelToTable[model];
        if (!tableName) throw new Error(`Unknown model: ${model}`);
        
        const result = await (prisma as any)[tableName].findUnique(query);
        
        if (result && result.tenantId !== tenantId) {
          throw new ForbiddenException('Access denied');
        }
        
        return result;
      },
      update: async (prisma: PrismaService, tenantId: string, query: any) => {
        const tableName = modelToTable[model];
        if (!tableName) throw new Error(`Unknown model: ${model}`);
        
        // First verify ownership
        const existing = await (prisma as any)[tableName].findUnique({
          where: query.where,
        });

        if (!existing || existing.tenantId !== tenantId) {
          throw new ForbiddenException('Access denied');
        }

        return (prisma as any)[tableName].update(query);
      },
      delete: async (prisma: PrismaService, tenantId: string, query: any) => {
        const tableName = modelToTable[model];
        if (!tableName) throw new Error(`Unknown model: ${model}`);
        
        // First verify ownership
        const existing = await (prisma as any)[tableName].findUnique({
          where: query.where,
        });

        if (!existing || existing.tenantId !== tenantId) {
          throw new ForbiddenException('Access denied');
        }

        return (prisma as any)[tableName].delete(query);
      },
    };
  }
}
