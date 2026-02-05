import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DSARRequest {
  id: string;
  userId: string;
  requestType: 'access' | 'erasure' | 'portability' | 'correction' | 'restriction';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  details: any;
  deadline: Date;
  completedAt?: Date;
  createdAt: Date;
}

@Injectable()
export class GDPRService {
  constructor(private readonly prisma: PrismaService) {}

  // DSAR (Data Subject Access Request) Management
  async createDSAR(
    tenantId: string,
    data: {
      userId: string;
      email: string;
      requestType: string;
      details?: Record<string, any>;
    },
  ): Promise<any> {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30); // 30 days as per GDPR

    return this.prisma.dataSubjectRequest.create({
      data: {
        tenantId,
        userId: data.userId,
        email: data.email,
        requestType: data.requestType,
        status: 'pending',
        details: data.details || {},
        deadline,
      },
    });
  }

  async getDSAR(
    tenantId: string,
    requestId: string,
  ): Promise<any> {
    return this.prisma.dataSubjectRequest.findUnique({
      where: { id: requestId },
    });
  }

  async getDSARRequests(
    tenantId: string,
    filters?: {
      status?: string;
      requestType?: string;
      userId?: string;
    },
  ): Promise<any[]> {
    const where: any = { tenantId };

    if (filters?.status) where.status = filters.status;
    if (filters?.requestType) where.requestType = filters.requestType;
    if (filters?.userId) where.userId = filters.userId;

    return this.prisma.dataSubjectRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDSARStatus(
    requestId: string,
    status: string,
    notes?: string,
  ): Promise<any> {
    const updateData: any = { status };

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    return this.prisma.dataSubjectRequest.update({
      where: { id: requestId },
      data: {
        ...updateData,
        details: { notes },
      },
    });
  }

  // Data Export (Right to Access)
  async exportUserData(
    tenantId: string,
    userId: string,
  ): Promise<{
    userProfile: any;
    applications: any[];
    resumes: any[];
    interviews: any[];
    consentRecords: any[];
    exportedAt: string;
  }> {
    const [userProfile, applications, resumes, interviews, consentRecords] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            lastLoginAt: true,
            createdAt: true,
          },
        }),
        this.prisma.application.findMany({
          where: { userId, tenantId },
          select: {
            id: true,
            status: true,
            jobTitle: true,
            companyName: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.resume.findMany({
          where: { userId, tenantId },
          select: {
            id: true,
            fileName: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.interviewSession.findMany({
          where: { userId, tenantId },
          select: {
            id: true,
            interviewType: true,
            status: true,
            scheduledAt: true,
            createdAt: true,
          },
        }),
        this.prisma.consentRecord.findMany({
          where: { userId, tenantId },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    return {
      userProfile,
      applications,
      resumes,
      interviews,
      consentRecords,
      exportedAt: new Date().toISOString(),
    };
  }

  // Data Erasure (Right to be Forgotten)
  async processDataErasure(
    tenantId: string,
    userId: string,
    options?: {
      retainLegalHolds?: boolean;
      retainFinancialRecords?: boolean;
    },
  ): Promise<{
    erasedRecords: Record<string, number>;
    retainedRecords: Record<string, number>;
    erasureCompletedAt: string;
  }> {
    const erasureResult: Record<string, number> = {};
    const retained: Record<string, number> = {};

    // Delete consent records
    if (!options?.retainLegalHolds) {
      const consentCount = await this.prisma.consentRecord.deleteMany({
        where: { userId, tenantId },
      });
      erasureResult.consentRecords = consentCount.count;
    } else {
      retained.consentRecords = await this.prisma.consentRecord.count({
        where: { userId, tenantId },
      });
    }

    // Delete DSAR requests
    const dsarCount = await this.prisma.dataSubjectRequest.deleteMany({
      where: { userId, tenantId },
    });
    erasureResult.dataSubjectRequests = dsarCount.count;

    // Delete PHI access logs
    const phiCount = await this.prisma.pHIAccessLog.deleteMany({
      where: { patientId: userId, tenantId },
    });
    erasureResult.phiAccessLogs = phiCount.count;

    // Anonymize user data instead of full deletion (for legal compliance)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@anonymized.local`,
        firstName: 'Deleted',
        lastName: 'User',
        password: '[DELETED]',
      },
    });

    return {
      erasedRecords: erasureResult,
      retainedRecords: retained,
      erasureCompletedAt: new Date().toISOString(),
    };
  }

  // Consent Management
  async recordConsent(
    tenantId: string,
    data: {
      userId: string;
      consentType: string;
      purpose: string;
      granted: boolean;
      source: string;
      ipAddress?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<any> {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiration

    return this.prisma.consentRecord.create({
      data: {
        tenantId,
        userId: data.userId,
        consentType: data.consentType,
        purpose: data.purpose,
        status: data.granted ? 'granted' : 'denied',
        grantedAt: data.granted ? new Date() : null,
        expiresAt,
        source: data.source,
        ipAddress: data.ipAddress,
        metadata: data.metadata,
        version: '1.0',
      },
    });
  }

  async getUserConsents(
    tenantId: string,
    userId: string,
  ): Promise<any[]> {
    return this.prisma.consentRecord.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async withdrawConsent(
    tenantId: string,
    userId: string,
    consentType: string,
  ): Promise<any> {
    return this.prisma.consentRecord.updateMany({
      where: { tenantId, userId, consentType },
      data: {
        status: 'withdrawn',
        withdrawnAt: new Date(),
      },
    });
  }

  // Data Portability Export
  async exportDataPortability(
    tenantId: string,
    userId: string,
    format: 'json' | 'csv' = 'json',
  ): Promise<any> {
    const data = await this.exportUserData(tenantId, userId);

    if (format === 'csv') {
      // Convert to CSV format
      return {
        format: 'csv',
        data: this.convertToCSV(data),
        exportedAt: new Date().toISOString(),
      };
    }

    return {
      format: 'json',
      data,
      exportedAt: new Date().toISOString(),
    };
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion
    const lines: string[] = [];
    
    // User profile
    lines.push('User Profile');
    if (data.userProfile) {
      Object.entries(data.userProfile).forEach(([key, value]) => {
        lines.push(`${key},${value}`);
      });
    }

    return lines.join('\n');
  }

  // DSAR Statistics
  async getDSARStatistics(tenantId: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
    averageResponseTime: number;
    overdueRequests: number;
  }> {
    const [total, pending, completed, overdue] = await Promise.all([
      this.prisma.dataSubjectRequest.count({ where: { tenantId } }),
      this.prisma.dataSubjectRequest.count({ where: { tenantId, status: 'pending' } }),
      this.prisma.dataSubjectRequest.count({ where: { tenantId, status: 'completed' } }),
      this.prisma.dataSubjectRequest.count({
        where: {
          tenantId,
          status: { in: ['pending', 'in_progress'] },
          deadline: { lt: new Date() },
        },
      }),
    ]);

    // Calculate average response time
    const completedRequests = await this.prisma.dataSubjectRequest.findMany({
      where: { tenantId, status: 'completed' },
      select: { createdAt: true, completedAt: true },
    });

    let avgResponseTime = 0;
    if (completedRequests.length > 0) {
      const totalTime = completedRequests.reduce((sum, req) => {
        if (req.completedAt) {
          return (
            sum +
            (req.completedAt.getTime() - req.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
        }
        return sum;
      }, 0);
      avgResponseTime = Math.round(totalTime / completedRequests.length);
    }

    return {
      totalRequests: total,
      pendingRequests: pending,
      completedRequests: completed,
      averageResponseTime: avgResponseTime,
      overdueRequests: overdue,
    };
  }
}
