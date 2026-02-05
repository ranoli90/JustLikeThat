import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PHIReport {
  id: string;
  patientId: string;
  accessorId: string;
  accessType: string;
  resourceType: string;
  purpose: string;
  timestamp: Date;
}

@Injectable()
export class HIPAAService {
  constructor(private readonly prisma: PrismaService) {}

  // PHI Access Logging
  async logPHIAccess(
    tenantId: string,
    data: {
      patientId: string;
      accessorId: string;
      accessorRole: string;
      accessType: string;
      resourceType: string;
      resourceId?: string;
      purpose?: string;
      ipAddress: string;
      userAgent?: string;
      details?: Record<string, any>;
    },
  ): Promise<any> {
    return this.prisma.pHIAccessLog.create({
      data: {
        tenantId,
        patientId: data.patientId,
        accessorId: data.accessorId,
        accessorRole: data.accessorRole,
        accessType: data.accessType,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        purpose: data.purpose,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        details: data.details || {},
        breachDetected: false,
      },
    });
  }

  async getPHIAccessLogs(
    tenantId: string,
    filters?: {
      patientId?: string;
      accessorId?: string;
      accessType?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<any[]> {
    const where: any = { tenantId };

    if (filters?.patientId) where.patientId = filters.patientId;
    if (filters?.accessorId) where.accessorId = filters.accessorId;
    if (filters?.accessType) where.accessType = filters.accessType;
    if (filters?.resourceType) where.resourceType = filters.resourceType;

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters?.startDate) where.createdAt.gte = filters.startDate;
      if (filters?.endDate) where.createdAt.lte = filters.endDate;
    }

    return this.prisma.pHIAccessLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  // Breach Notification
  async reportBreach(
    tenantId: string,
    data: {
      title: string;
      description: string;
      affectedRecords: number;
      affectedSystems: string[];
      breachDate: Date;
      discoveryDate: Date;
      reportedBy: string;
    },
  ): Promise<any> {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 60); // 60 days as per HIPAA

    // Create incident record
    const incident = await this.prisma.securityIncident.create({
      data: {
        tenantId,
        title: `PHI Breach: ${data.title}`,
        description: data.description,
        severity: 'critical',
        status: 'open',
        affectedUsers: data.affectedRecords,
        affectedSystems: data.affectedSystems,
        timeline: [
          {
            timestamp: new Date().toISOString(),
            action: 'Breach reported',
            performedBy: data.reportedBy,
            notes: `Breach discovered on ${data.discoveryDate.toISOString()}`,
          },
          {
            timestamp: new Date().toISOString(),
            action: 'Breach notification deadline set',
            notes: `Deadline: ${deadline.toISOString()}`,
          },
        ],
      },
    });

    return {
      incident,
      breachNotificationDeadline: deadline,
      instructions: {
        notifyHHS: 'Required within 60 days if breach affects 500+ individuals',
        notifyAffected: 'Required without unreasonable delay',
        notifyMedia: 'Required if breach affects 500+ individuals in a single state',
      },
    };
  }

  async getBreachIncidents(tenantId: string): Promise<any[]> {
    return this.prisma.securityIncident.findMany({
      where: {
        tenantId,
        title: { contains: 'PHI Breach' },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Business Associate Agreement (BAA) Management
  async createBAA(
    tenantId: string,
    data: {
      vendorName: string;
      vendorId?: string;
      serviceType: string;
      contactName?: string;
      contactEmail?: string;
      terms?: Record<string, any>;
    },
  ): Promise<any> {
    return this.prisma.businessAssociateAgreement.create({
      data: {
        tenantId,
        vendorName: data.vendorName,
        vendorId: data.vendorId,
        serviceType: data.serviceType,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        terms: data.terms,
        baaStatus: 'draft',
      },
    });
  }

  async updateBAA(
    id: string,
    data: Partial<{
      baaStatus: string;
      signedDate: Date;
      expirationDate: Date;
      contactName: string;
      contactEmail: string;
      notes: string;
    }>,
  ): Promise<any> {
    return this.prisma.businessAssociateAgreement.update({
      where: { id },
      data,
    });
  }

  async signBAA(id: string): Promise<any> {
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 1 year

    return this.prisma.businessAssociateAgreement.update({
      where: { id },
      data: {
        baaStatus: 'active',
        signedDate: new Date(),
        expirationDate,
      },
    });
  }

  async getBAAs(tenantId: string, status?: string): Promise<any[]> {
    const where: any = { tenantId };
    if (status) where.baaStatus = status;

    return this.prisma.businessAssociateAgreement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBAAStatus(tenantId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    draft: number;
    expiringWithin30Days: number;
  }> {
    const [total, active, expired, draft] = await Promise.all([
      this.prisma.businessAssociateAgreement.count({ where: { tenantId } }),
      this.prisma.businessAssociateAgreement.count({
        where: { tenantId, baaStatus: 'active' },
      }),
      this.prisma.businessAssociateAgreement.count({
        where: { tenantId, baaStatus: 'expired' },
      }),
      this.prisma.businessAssociateAgreement.count({
        where: { tenantId, baaStatus: 'draft' },
      }),
    ]);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringWithin30Days = await this.prisma.businessAssociateAgreement.count({
      where: {
        tenantId,
        baaStatus: 'active',
        expirationDate: { lte: thirtyDaysFromNow },
      },
    });

    return {
      total,
      active,
      expired,
      draft,
      expiringWithin30Days,
    };
  }

  // HIPAA Compliance Reports
  async getHIPAAReport(tenantId: string): Promise<{
    phiAccessSummary: any;
    baaStatus: any;
    breachIncidents: any;
    complianceScore: number;
  }> {
    const [phiAccessLogs, baaStatus, breachIncidents] = await Promise.all([
      this.getPHIAccessLogs(tenantId),
      this.getBAAStatus(tenantId),
      this.getBreachIncidents(tenantId),
    ]);

    const complianceScore = await this.calculateHIPAAComplianceScore(tenantId);

    return {
      phiAccessSummary: {
        totalAccess: phiAccessLogs.length,
        byAccessType: this.groupBy(phiAccessLogs, 'accessType'),
        byResourceType: this.groupBy(phiAccessLogs, 'resourceType'),
      },
      baaStatus,
      breachIncidents: {
        total: breachIncidents.length,
        recent: breachIncidents.slice(0, 5),
      },
      complianceScore,
    };
  }

  private groupBy(data: any[], key: string): Record<string, number> {
    return data.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private async calculateHIPAAComplianceScore(tenantId: string): Promise<number> {
    const baaStatus = await this.getBAAStatus(tenantId);
    
    let score = 100;

    // Deduct for expired BAAs
    score -= baaStatus.expired * 10;

    // Deduct for expiring BAAs
    score -= baaStatus.expiringWithin30Days * 5;

    // Deduct for missing BAAs
    if (baaStatus.total === 0) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  // Encryption Status
  async getEncryptionStatus(tenantId: string): Promise<{
    dataAtRest: boolean;
    dataInTransit: boolean;
    keyRotation: boolean;
    lastRotation: Date | null;
    encryptionAlgorithm: string;
  }> {
    // In production, this would check actual encryption status
    return {
      dataAtRest: true,
      dataInTransit: true,
      keyRotation: true,
      lastRotation: new Date(Date.now() - 30 * 86400000),
      encryptionAlgorithm: 'AES-256-GCM',
    };
  }

  // Access Control Audit
  async getAccessControlAudit(tenantId: string): Promise<{
    roles: any[];
    permissions: any[];
    recentChanges: any[];
  }> {
    const accessLogs = await this.getPHIAccessLogs(tenantId, {
      accessType: 'update',
    });

    const recentChanges = accessLogs.slice(0, 20);

    return {
      roles: [
        { name: 'admin', permissions: ['read', 'write', 'delete'] },
        { name: 'clinician', permissions: ['read', 'write'] },
        { name: 'billing', permissions: ['read'] },
        { name: 'patient', permissions: ['read_own'] },
      ],
      permissions: [
        { resource: 'medical_records', actions: ['read', 'write', 'delete'] },
        { resource: 'prescriptions', actions: ['read', 'write'] },
        { resource: 'lab_results', actions: ['read', 'write'] },
        { resource: 'billing', actions: ['read'] },
      ],
      recentChanges,
    };
  }
}
