import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DataResidencyRule {
  ruleId: string;
  tenantId?: string;
  region: 'eu' | 'us' | 'apac' | 'uk' | 'canada';
  dataType: 'user_data' | 'application_data' | 'analytics_data';
  storageRegions: string[];
  isRequired: boolean;
  retentionDays: number;
}

export interface DataResidencyAudit {
  ruleId: string;
  operation: 'read' | 'write' | 'delete' | 'transfer';
  sourceRegion: string;
  targetRegion?: string;
  dataType: string;
  recordId?: string;
  tenantId?: string;
  ipAddress: string;
  userId?: string;
  compliance: boolean;
  timestamp: Date;
}

export interface ComplianceResult {
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  checkedAt: Date;
}

@Injectable()
export class DataResidencyService implements OnModuleInit {
  private readonly logger = new Logger(DataResidencyService.name);

  // Data residency regions with their requirements
  private readonly regionRequirements: Record<string, { laws: string[]; restrictions: string[] }> = {
    eu: {
      laws: ['GDPR', 'ePrivacy Directive'],
      restrictions: ['data_must_stay_in_eu', 'require_consent', 'right_to_erasure'],
    },
    us: {
      laws: ['CCPA', 'COPPA', 'HIPAA'],
      restrictions: ['federal_laws_apply', 'state_laws_vary'],
    },
    uk: {
      laws: ['UK GDPR', 'Data Protection Act 2018'],
      restrictions: ['data_must_stay_in_uk', ' adequacy_decision'],
    },
    apac: {
      laws: ['PDPA', 'PIPL', 'APPI'],
      restrictions: ['data_localization_varies', 'consent_required'],
    },
    canada: {
      laws: ['PIPEDA', 'Provincial Privacy Laws'],
      restrictions: ['data_must_stay_in_canada', 'consent_required'],
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Initialize default data residency rules
    await this.initializeDefaultRules();
  }

  private async initializeDefaultRules(): Promise<void> {
    const defaultRules: Omit<DataResidencyRule, 'ruleId'>[] = [
      {
        tenantId: null,
        region: 'eu',
        dataType: 'user_data',
        storageRegions: ['aws-eu-west-1', 'aws-eu-central-1', 'gcp-europe-west1'],
        isRequired: true,
        retentionDays: 2555, // ~7 years for GDPR
      },
      {
        tenantId: null,
        region: 'eu',
        dataType: 'analytics_data',
        storageRegions: ['aws-eu-west-1', 'gcp-europe-west1'],
        isRequired: true,
        retentionDays: 730, // 2 years
      },
      {
        tenantId: null,
        region: 'us',
        dataType: 'user_data',
        storageRegions: ['aws-us-east-1', 'aws-us-west-2', 'gcp-us-central1'],
        isRequired: false,
        retentionDays: 1825, // 5 years
      },
      {
        tenantId: null,
        region: 'apac',
        dataType: 'user_data',
        storageRegions: ['aws-ap-southeast-1', 'aws-ap-northeast-1', 'gcp-asia-northeast1'],
        isRequired: true,
        retentionDays: 1095, // 3 years
      },
    ];

    for (const rule of defaultRules) {
      const ruleId = `rule-${rule.region}-${rule.dataType}-${Date.now()}`;
      await this.prisma.dataResidencyRule.create({
        data: {
          ruleId,
          ...rule,
        },
      });
      this.logger.log(`Initialized data residency rule: ${rule.region} - ${rule.dataType}`);
    }
  }

  async getAllRules(): Promise<DataResidencyRule[]> {
    const rules = await this.prisma.dataResidencyRule.findMany();
    return rules.map(r => ({
      ruleId: r.ruleId,
      tenantId: r.tenantId || undefined,
      region: r.region as any,
      dataType: r.dataType as any,
      storageRegions: r.storageRegions,
      isRequired: r.isRequired,
      retentionDays: r.retentionDays,
    }));
  }

  async getRuleById(ruleId: string): Promise<DataResidencyRule | null> {
    const r = await this.prisma.dataResidencyRule.findUnique({
      where: { ruleId },
    });

    if (!r) return null;

    return {
      ruleId: r.ruleId,
      tenantId: r.tenantId || undefined,
      region: r.region as any,
      dataType: r.dataType as any,
      storageRegions: r.storageRegions,
      isRequired: r.isRequired,
      retentionDays: r.retentionDays,
    };
  }

  async createRule(data: Omit<DataResidencyRule, 'ruleId'>): Promise<DataResidencyRule> {
    const ruleId = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const rule = await this.prisma.dataResidencyRule.create({
      data: {
        ruleId,
        ...data,
      },
    });

    this.logger.log(`Created data residency rule: ${rule.ruleId}`);

    return {
      ruleId: rule.ruleId,
      tenantId: rule.tenantId || undefined,
      region: rule.region as any,
      dataType: rule.dataType as any,
      storageRegions: rule.storageRegions,
      isRequired: rule.isRequired,
      retentionDays: rule.retentionDays,
    };
  }

  async updateRule(ruleId: string, updates: Partial<DataResidencyRule>): Promise<DataResidencyRule | null> {
    const rule = await this.prisma.dataResidencyRule.update({
      where: { ruleId },
      data: updates as any,
    });

    this.logger.log(`Updated data residency rule: ${rule.ruleId}`);

    return {
      ruleId: rule.ruleId,
      tenantId: rule.tenantId || undefined,
      region: rule.region as any,
      dataType: rule.dataType as any,
      storageRegions: rule.storageRegions,
      isRequired: rule.isRequired,
      retentionDays: rule.retentionDays,
    };
  }

  async deleteRule(ruleId: string): Promise<void> {
    await this.prisma.dataResidencyRule.delete({
      where: { ruleId },
    });
    this.logger.log(`Deleted data residency rule: ${ruleId}`);
  }

  async logAuditEvent(event: Omit<DataResidencyAudit, 'timestamp' | 'compliance'>): Promise<DataResidencyAudit> {
    // Check compliance
    const compliance = await this.checkCompliance(event);

    const audit = await this.prisma.dataResidencyAudit.create({
      data: {
        ruleId: event.ruleId,
        operation: event.operation,
        sourceRegion: event.sourceRegion,
        targetRegion: event.targetRegion,
        dataType: event.dataType,
        recordId: event.recordId,
        tenantId: event.tenantId,
        ipAddress: event.ipAddress,
        userId: event.userId,
        compliance: compliance.isCompliant,
      },
    });

    if (!compliance.isCompliant) {
      this.logger.warn(`Non-compliant data operation detected: ${event.operation} in ${event.sourceRegion}`);
    }

    return {
      ruleId: audit.ruleId,
      operation: audit.operation,
      sourceRegion: audit.sourceRegion,
      targetRegion: audit.targetRegion || undefined,
      dataType: audit.dataType,
      recordId: audit.recordId || undefined,
      tenantId: audit.tenantId || undefined,
      ipAddress: audit.ipAddress,
      userId: audit.userId || undefined,
      compliance: audit.compliance,
      timestamp: audit.timestamp,
    };
  }

  async getAuditLogs(filters?: {
    tenantId?: string;
    region?: string;
    dataType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<DataResidencyAudit[]> {
    const where: any = {};

    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.dataType) where.dataType = filters.dataType;
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const logs = await this.prisma.dataResidencyAudit.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    return logs.map(l => ({
      ruleId: l.ruleId,
      operation: l.operation,
      sourceRegion: l.sourceRegion,
      targetRegion: l.targetRegion || undefined,
      dataType: l.dataType,
      recordId: l.recordId || undefined,
      tenantId: l.tenantId || undefined,
      ipAddress: l.ipAddress,
      userId: l.userId || undefined,
      compliance: l.compliance,
      timestamp: l.timestamp,
    }));
  }

  async checkCompliance(event: Omit<DataResidencyAudit, 'compliance' | 'timestamp'>): Promise<ComplianceResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Get the rule
    const rule = await this.getRuleById(event.ruleId);
    if (!rule) {
      issues.push(`Rule ${event.ruleId} not found`);
      return { isCompliant: false, issues, warnings, checkedAt: new Date() };
    }

    // Check if source region is allowed
    if (!rule.storageRegions.includes(event.sourceRegion)) {
      issues.push(`Source region ${event.sourceRegion} is not in allowed storage regions`);
    }

    // Check cross-region transfer
    if (event.targetRegion && !rule.storageRegions.includes(event.targetRegion)) {
      issues.push(`Target region ${event.targetRegion} is not in allowed storage regions`);
    }

    // Check if consent is required for the region
    const regionInfo = this.regionRequirements[rule.region];
    if (regionInfo?.restrictions.includes('require_consent')) {
      // In real implementation, check if consent was obtained
      warnings.push(`Consent may be required for ${rule.region} data operations`);
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      warnings,
      checkedAt: new Date(),
    };
  }

  async validateDataLocation(dataType: string, currentRegion: string, tenantId?: string): Promise<{
    isCompliant: boolean;
    allowedRegions: string[];
    requiresMigration: boolean;
  }> {
    // Find applicable rules
    const rules = await this.prisma.dataResidencyRule.findMany({
      where: {
        dataType,
        OR: [
          { tenantId: tenantId || null },
          { tenantId: undefined },
        ],
      },
    });

    const applicableRule = rules.find(r => r.storageRegions.includes(currentRegion));
    const allowedRegions = rules.flatMap(r => r.storageRegions);

    return {
      isCompliant: !!applicableRule,
      allowedRegions: [...new Set(allowedRegions)],
      requiresMigration: !applicableRule,
    };
  }

  async getRegionComplianceStatus(): Promise<{
    region: string;
    compliant: boolean;
    ruleCount: number;
    auditCount: number;
  }[]> {
    const regions = ['eu', 'us', 'apac', 'uk', 'canada'];
    const status = [];

    for (const region of regions) {
      const rules = await this.prisma.dataResidencyRule.findMany({
        where: { region },
      });

      const auditCount = await this.prisma.dataResidencyAudit.count({
        where: {
          ruleId: { in: rules.map(r => r.ruleId) },
        },
      });

      status.push({
        region,
        compliant: rules.length > 0,
        ruleCount: rules.length,
        auditCount,
      });
    }

    return status;
  }
}
