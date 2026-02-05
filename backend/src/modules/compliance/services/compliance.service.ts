import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getComplianceByRegion(regionCode: string): Promise<any[]> {
    return this.prisma.complianceRequirement.findMany({
      where: { regionCode, isActive: true },
    });
  }

  async getComplianceByRegulation(
    regionCode: string,
    regulation: string,
  ): Promise<any | null> {
    return this.prisma.complianceRequirement.findFirst({
      where: { regionCode, regulation, isActive: true },
    });
  }

  async createComplianceRequirement(data: {
    regionCode: string;
    regulation: string;
    regulationType: string;
    requirements: any;
    dataRetention?: any;
    consentRequired: boolean;
    penalties?: string;
    fineAmount?: number;
    fineCurrency?: string;
    effectiveFrom: Date;
    version?: string;
    sourceUrl?: string;
  }): Promise<any> {
    return this.prisma.complianceRequirement.create({
      data: {
        ...data,
        regulationType: data.regulationType as any,
      },
    });
  }

  async updateComplianceRequirement(
    id: string,
    data: Partial<{
      requirements: any;
      dataRetention: any;
      consentRequired: boolean;
      penalties: string;
      fineAmount: number;
      fineCurrency: string;
      isActive: boolean;
      effectiveTo: Date;
      version: string;
      sourceUrl: string;
      lastReviewedAt: Date;
      reviewedBy: string;
    }>,
  ): Promise<any> {
    return this.prisma.complianceRequirement.update({
      where: { id },
      data,
    });
  }

  async deleteComplianceRequirement(id: string): Promise<void> {
    await this.prisma.complianceRequirement.delete({
      where: { id },
    });
  }

  async checkCompliance(
    regionCode: string,
    regulation: string,
    requirements: Record<string, unknown>,
  ): Promise<{
    compliant: boolean;
    missingRequirements: string[];
    warnings: string[];
  }> {
    const compliance = await this.getComplianceByRegulation(regionCode, regulation);
    
    if (!compliance) {
      return {
        compliant: true,
        missingRequirements: [],
        warnings: ['No specific compliance requirements found for this region/regulation'],
      };
    }

    const requiredFields = compliance.requirements as string[];
    const missingRequirements: string[] = [];
    const warnings: string[] = [];

    for (const field of requiredFields) {
      if (!(field in requirements)) {
        missingRequirements.push(field);
      }
    }

    return {
      compliant: missingRequirements.length === 0,
      missingRequirements,
      warnings,
    };
  }

  async initializeDefaultCompliance(): Promise<void> {
    const defaultCompliance = [
      // GDPR (EU)
      {
        regionCode: 'EU',
        regulation: 'GDPR',
        regulationType: 'GDPR',
        requirements: [
          'data_consent',
          'data_access_request',
          'data_deletion_request',
          'data_portability',
          'privacy_policy',
          'data_processing_agreement',
        ],
        dataRetention: { personal_data: 730, logs: 90 },
        consentRequired: true,
        penalties: 'Up to €20 million or 4% of global annual turnover',
        fineAmount: 20000000,
        fineCurrency: 'EUR',
        effectiveFrom: new Date('2018-05-25'),
      },
      // CCPA (California)
      {
        regionCode: 'NA',
        regulation: 'CCPA',
        regulationType: 'CCPA',
        requirements: [
          'privacy_notice',
          'do_not_sell',
          'data_access_request',
          'data_deletion_request',
          'non_discrimination',
        ],
        dataRetention: { personal_data: 365 },
        consentRequired: false,
        penalties: '$7500 per intentional violation',
        fineAmount: 7500,
        fineCurrency: 'USD',
        effectiveFrom: new Date('2020-01-01'),
      },
      // LGPD (Brazil)
      {
        regionCode: 'LATAM',
        regulation: 'LGPD',
        regulationType: 'LGPD',
        requirements: [
          'consent',
          'data_access',
          'data_correction',
          'data_anonymization',
          'data_portability',
          'data_deletion',
        ],
        dataRetention: { personal_data: 365 },
        consentRequired: true,
        penalties: 'Up to 2% of revenue, capped at R$50 million per violation',
        fineAmount: 50000000,
        fineCurrency: 'BRL',
        effectiveFrom: new Date('2020-09-18'),
      },
      // PIPEDA (Canada)
      {
        regionCode: 'NA',
        regulation: 'PIPEDA',
        regulationType: 'PIPEDA',
        requirements: [
          'consent',
          'accountability',
          'purpose_identification',
          'limiting_collection',
          'accuracy',
          'safeguards',
          'openness',
          'individual_access',
        ],
        dataRetention: { personal_data: 730 },
        consentRequired: true,
        penalties: 'Up to CAD $100,000 per violation',
        fineAmount: 100000,
        fineCurrency: 'CAD',
        effectiveFrom: new Date('2000-01-01'),
      },
      // POPIA (South Africa)
      {
        regionCode: 'MEA',
        regulation: 'POPIA',
        regulationType: 'POPIA',
        requirements: [
          'accountability',
          'processing_limitation',
          'purpose_specification',
          'information_quality',
          'openness',
          'security_safeguards',
          'data_subject_participation',
        ],
        dataRetention: { personal_data: 365 },
        consentRequired: true,
        penalties: 'Up to R10 million or 10% of annual turnover',
        fineAmount: 10000000,
        fineCurrency: 'ZAR',
        effectiveFrom: new Date('2020-07-01'),
      },
    ];

    for (const compliance of defaultCompliance) {
      await this.prisma.complianceRequirement.upsert({
        where: {
          id: `compliance-${compliance.regionCode}-${compliance.regulation}`,
        },
        update: compliance,
        create: {
          id: `compliance-${compliance.regionCode}-${compliance.regulation}`,
          ...compliance,
        },
      });
    }
  }
}
