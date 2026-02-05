import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DataResidencyService {
  private readonly logger = new Logger(DataResidencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDataResidencyRule(
    regionCode: string,
    dataCategory: string,
  ): Promise<any | null> {
    return this.prisma.dataResidencyRule.findFirst({
      where: { regionCode, dataCategory, isActive: true },
    });
  }

  async createDataResidencyRule(data: {
    regionCode: string;
    dataCategory: string;
    allowedRegions: string[];
    restrictedRegions?: string[];
    primaryRegion?: string;
    fallbackRegion?: string;
    canProcess?: string[];
    cannotProcess?: string[];
    requiresEncryption?: boolean;
    retentionPeriod?: number;
    retentionPolicy?: string;
    priority?: number;
  }): Promise<any> {
    return this.prisma.dataResidencyRule.create({
      data: {
        ...data,
        canProcess: data.canProcess || ['all'],
        cannotProcess: data.cannotProcess || [],
        requiresEncryption: data.requiresEncryption ?? true,
        priority: data.priority || 0,
      },
    });
  }

  async updateDataResidencyRule(
    id: string,
    data: Partial<{
      allowedRegions: string[];
      restrictedRegions: string[];
      primaryRegion: string;
      fallbackRegion: string;
      canProcess: string[];
      cannotProcess: string[];
      requiresEncryption: boolean;
      retentionPeriod: number;
      retentionPolicy: string;
      isActive: boolean;
      priority: number;
    }>,
  ): Promise<any> {
    return this.prisma.dataResidencyRule.update({
      where: { id },
      data,
    });
  }

  async deleteDataResidencyRule(id: string): Promise<void> {
    await this.prisma.dataResidencyRule.delete({
      where: { id },
    });
  }

  async getRulesByRegion(regionCode: string): Promise<any[]> {
    return this.prisma.dataResidencyRule.findMany({
      where: { regionCode, isActive: true },
      orderBy: { priority: 'desc' },
    });
  }

  async checkDataResidency(
    regionCode: string,
    dataCategory: string,
    targetRegion: string,
  ): Promise<{
    allowed: boolean;
    requiresEncryption: boolean;
    retentionPeriod: number | null;
    reason?: string;
  }> {
    const rule = await this.getDataResidencyRule(regionCode, dataCategory);

    if (!rule) {
      return {
        allowed: true,
        requiresEncryption: true,
        retentionPeriod: 365,
      };
    }

    if (rule.allowedRegions.length > 0 && !rule.allowedRegions.includes(targetRegion)) {
      return {
        allowed: false,
        requiresEncryption: rule.requiresEncryption,
        retentionPeriod: rule.retentionPeriod,
        reason: `Data residency requirement: ${targetRegion} is not in the allowed regions`,
      };
    }

    if (rule.restrictedRegions.length > 0 && rule.restrictedRegions.includes(targetRegion)) {
      return {
        allowed: false,
        requiresEncryption: rule.requiresEncryption,
        retentionPeriod: rule.retentionPeriod,
        reason: `Data residency requirement: ${targetRegion} is a restricted region`,
      };
    }

    return {
      allowed: true,
      requiresEncryption: rule.requiresEncryption,
      retentionPeriod: rule.retentionPeriod,
    };
  }

  async initializeDefaultDataResidencyRules(): Promise<void> {
    const defaultRules = [
      // EU GDPR data residency
      {
        regionCode: 'EU',
        dataCategory: 'personal_data',
        allowedRegions: ['EU', 'UK', 'CH', 'NO', 'IS', 'LI'],
        restrictedRegions: ['US', 'CN', 'RU', 'IN'],
        primaryRegion: 'EU',
        fallbackRegion: 'EU',
        canProcess: ['EU', 'UK'],
        cannotProcess: ['US'],
        requiresEncryption: true,
        retentionPeriod: 730,
        retentionPolicy: 'GDPR compliant retention',
        priority: 100,
      },
      // US data residency (CCPA)
      {
        regionCode: 'NA',
        dataCategory: 'personal_data',
        allowedRegions: ['US', 'CA'],
        restrictedRegions: [],
        primaryRegion: 'US',
        fallbackRegion: 'US',
        canProcess: ['US', 'CA'],
        cannotProcess: [],
        requiresEncryption: true,
        retentionPeriod: 365,
        retentionPolicy: 'CCPA compliant retention',
        priority: 50,
      },
      // APAC data residency
      {
        regionCode: 'APAC',
        dataCategory: 'personal_data',
        allowedRegions: ['APAC'],
        restrictedRegions: [],
        primaryRegion: 'SG',
        fallbackRegion: 'APAC',
        canProcess: ['APAC'],
        cannotProcess: [],
        requiresEncryption: true,
        retentionPeriod: 365,
        retentionPolicy: 'Local data protection compliant retention',
        priority: 50,
      },
    ];

    for (const rule of defaultRules) {
      await this.prisma.dataResidencyRule.upsert({
        where: {
          id: `data-residency-${rule.regionCode}-${rule.dataCategory}`,
        },
        update: rule,
        create: {
          id: `data-residency-${rule.regionCode}-${rule.dataCategory}`,
          ...rule,
        },
      });
    }
  }
}
