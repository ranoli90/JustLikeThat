// ============ ATS SERVICE ============

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GreenhouseService } from './ats/greenhouse.service';
import { LeverService } from './ats/lever.service';
import { WorkdayAtsService } from './ats/workday-ats.service';
import { BullhornService } from './ats/bullhorn.service';
import { IcimsService } from './ats/icims.service';
import { SmartRecruitersService } from './ats/smartrecruiters.service';

export interface CandidateData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  coverLetter?: string;
  notes?: string;
  source?: string;
}

@Injectable()
export class AtsService {
  private readonly logger = new Logger(AtsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly greenhouseService: GreenhouseService,
    private readonly leverService: LeverService,
    private readonly workdayAtsService: WorkdayAtsService,
    private readonly bullhornService: BullhornService,
    private readonly icimsService: IcimsService,
    private readonly smartRecruitersService: SmartRecruitersService,
  ) {}

  /**
   * Push application to ATS
   */
  async pushApplication(
    provider: string,
    applicationId: string,
    candidateData: CandidateData,
  ) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    try {
      switch (normalizedProvider) {
        case 'GREENHOUSE':
          return this.greenhouseService.createApplication(candidateData);
        case 'LEVER':
          return this.leverService.createOpportunity(candidateData);
        case 'WORKDAY_ATS':
          return this.workdayAtsService.createCandidate(candidateData);
        case 'BULLHORN':
          return this.bullhornService.createCandidate(candidateData);
        case 'ICIMS':
          return this.icimsService.createCandidate(candidateData);
        case 'SMART_RECRUITERS':
          return this.smartRecruitersService.createCandidate(candidateData);
        default:
          throw new NotFoundException(`Unknown ATS provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error(`Failed to push application to ${provider}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get ATS status
   */
  async getStatus(provider: string) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    switch (normalizedProvider) {
      case 'GREENHOUSE':
        return this.greenhouseService.getStatus();
      case 'LEVER':
        return this.leverService.getStatus();
      case 'WORKDAY_ATS':
        return this.workdayAtsService.getStatus();
      case 'BULLHORN':
        return this.bullhornService.getStatus();
      case 'ICIMS':
        return this.icimsService.getStatus();
      case 'SMART_RECRUITERS':
        return this.smartRecruitersService.getStatus();
      default:
        throw new NotFoundException(`Unknown ATS provider: ${provider}`);
    }
  }

  /**
   * Sync candidates from ATS
   */
  async syncCandidates(provider: string) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    switch (normalizedProvider) {
      case 'GREENHOUSE':
        return this.greenhouseService.syncCandidates();
      case 'LEVER':
        return this.leverService.syncOpportunities();
      default:
        throw new NotFoundException(`Sync not supported for provider: ${provider}`);
    }
  }

  /**
   * Get jobs from ATS
   */
  async getJobs(provider: string) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    switch (normalizedProvider) {
      case 'GREENHOUSE':
        return this.greenhouseService.getJobs();
      case 'LEVER':
        return this.leverService.getOpportunities();
      default:
        throw new NotFoundException(`Unknown ATS provider: ${provider}`);
    }
  }

  /**
   * Store ATS credentials
   */
  async storeCredentials(
    tenantId: string,
    provider: string,
    credentials: Record<string, any>,
  ) {
    return this.prisma.integrationConfig.upsert({
      where: {
        tenantId_providerName: {
          tenantId,
          providerName: provider.toUpperCase().replace('-', '_'),
        },
      },
      update: {
        credentials,
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        providerName: provider.toUpperCase().replace('-', '_'),
        integrationType: 'ATS',
        credentials,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Get ATS credentials
   */
  async getCredentials(tenantId: string, provider: string) {
    const config = await this.prisma.integrationConfig.findUnique({
      where: {
        tenantId_providerName: {
          tenantId,
          providerName: provider.toUpperCase().replace('-', '_'),
        },
      },
    });

    return config?.credentials;
  }
}
