import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ComplianceService } from '../services/compliance.service';
import { DataResidencyService } from '../services/data-residency.service';

@Controller('api/v1/compliance')
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly dataResidencyService: DataResidencyService,
  ) {}

  @Get('regions')
  async getComplianceRegions() {
    return [
      { code: 'NA', name: 'North America', regulations: ['CCPA', 'PIPEDA'] },
      { code: 'EU', name: 'Europe', regulations: ['GDPR'] },
      { code: 'APAC', name: 'Asia Pacific', regulations: ['PDPA', 'PIPL'] },
      { code: 'LATAM', name: 'Latin America', regulations: ['LGPD', 'PDPA'] },
      { code: 'MEA', name: 'Middle East & Africa', regulations: ['POPIA', 'ADGM'] },
    ];
  }

  @Get(':region')
  async getComplianceByRegion(@Param('region') regionCode: string) {
    return this.complianceService.getComplianceByRegion(regionCode);
  }

  @Get(':region/:regulation')
  async getComplianceByRegulation(
    @Param('region') regionCode: string,
    @Param('regulation') regulation: string,
  ) {
    return this.complianceService.getComplianceByRegulation(regionCode, regulation);
  }

  @Post(':region/:regulation/check')
  async checkCompliance(
    @Param('region') regionCode: string,
    @Param('regulation') regulation: string,
    @Body() data: { requirements: Record<string, unknown> },
  ) {
    return this.complianceService.checkCompliance(regionCode, regulation, data.requirements);
  }

  @Post()
  async createComplianceRequirement(
    @Body() data: {
      regionCode: string;
      regulation: string;
      regulationType: string;
      requirements: string[];
      dataRetention?: Record<string, number>;
      consentRequired: boolean;
      penalties?: string;
      fineAmount?: number;
      fineCurrency?: string;
      effectiveFrom: string;
      version?: string;
      sourceUrl?: string;
    },
  ) {
    return this.complianceService.createComplianceRequirement({
      ...data,
      effectiveFrom: new Date(data.effectiveFrom),
    });
  }

  @Put(':id')
  async updateComplianceRequirement(
    @Param('id') id: string,
    @Body() data: Partial<{
      requirements: string[];
      dataRetention: Record<string, number>;
      consentRequired: boolean;
      penalties: string;
      fineAmount: number;
      fineCurrency: string;
      isActive: boolean;
      effectiveTo: string;
      version: string;
      sourceUrl: string;
      lastReviewedAt: string;
      reviewedBy: string;
    }>,
  ) {
    return this.complianceService.updateComplianceRequirement(id, {
      ...data,
      ...(data.effectiveTo && { effectiveTo: new Date(data.effectiveTo) }),
      ...(data.lastReviewedAt && { lastReviewedAt: new Date(data.lastReviewedAt) }),
    });
  }

  @Delete(':id')
  async deleteComplianceRequirement(@Param('id') id: string) {
    await this.complianceService.deleteComplianceRequirement(id);
    return { success: true };
  }

  // Data Residency endpoints
  @Get('data-residency/:region')
  async getDataResidencyRules(@Param('region') regionCode: string) {
    return this.dataResidencyService.getRulesByRegion(regionCode);
  }

  @Get('data-residency/:region/:category')
  async getDataResidencyRule(
    @Param('region') regionCode: string,
    @Param('category') dataCategory: string,
  ) {
    return this.dataResidencyService.getDataResidencyRule(regionCode, dataCategory);
  }

  @Post('data-residency/check')
  async checkDataResidency(
    @Body() data: {
      regionCode: string;
      dataCategory: string;
      targetRegion: string;
    },
  ) {
    return this.dataResidencyService.checkDataResidency(
      data.regionCode,
      data.dataCategory,
      data.targetRegion,
    );
  }

  @Post('data-residency')
  async createDataResidencyRule(
    @Body() data: {
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
    },
  ) {
    return this.dataResidencyService.createDataResidencyRule(data);
  }

  @Post('initialize')
  async initializeDefaultCompliance() {
    await this.complianceService.initializeDefaultCompliance();
    await this.dataResidencyService.initializeDefaultDataResidencyRules();
    return { success: true, message: 'Default compliance rules initialized' };
  }
}
