// ============ JOB BOARD SERVICE ============

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { LinkedInService } from './job-boards/linkedin.service';
import { IndeedService } from './job-boards/indeed.service';
import { GlassdoorService } from './job-boards/glassdoor.service';
import { RemoteCoService } from './job-boards/remote-co.service';
import { AngelListService } from './job-boards/angel-list.service';
import { DiceService } from './job-boards/dice.service';

export interface JobSearchParams {
  query?: string;
  location?: string;
  remote?: boolean;
  datePosted?: string; // '24h', '7d', '30d'
  salary?: string;
  experience?: string;
  jobType?: string; // 'full-time', 'part-time', 'contract'
  page?: number;
  limit?: number;
}

export interface Job {
  id: string;
  provider: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  remote?: boolean;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  jobType?: string;
  experience?: string;
  description: string;
  requirements: string[];
  benefits?: string[];
  postedAt: Date;
  applicationUrl: string;
  sourceUrl: string;
  tags?: string[];
  sourceId: string;
}

@Injectable()
export class JobBoardService {
  private readonly logger = new Logger(JobBoardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly linkedInService: LinkedInService,
    private readonly indeedService: IndeedService,
    private readonly glassdoorService: GlassdoorService,
    private readonly remoteCoService: RemoteCoService,
    private readonly angelListService: AngelListService,
    private readonly diceService: DiceService,
  ) {}

  /**
   * Connect a job board provider with OAuth credentials
   */
  async connectProvider(provider: string, credentials: Record<string, any>) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    try {
      switch (normalizedProvider) {
        case 'LINKEDIN':
          return this.linkedInService.connect(credentials);
        case 'INDEED':
          return this.indeedService.connect(credentials);
        case 'GLASSDOOR':
          return this.glassdoorService.connect(credentials);
        case 'REMOTE_CO':
          return this.remoteCoService.connect(credentials);
        case 'ANGEL_LIST':
          return this.angelListService.connect(credentials);
        case 'DICE':
          return this.diceService.connect(credentials);
        default:
          throw new NotFoundException(`Unknown job board provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error(`Failed to connect ${provider}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search jobs across all connected providers
   */
  async searchJobs(params: JobSearchParams): Promise<{ jobs: Job[]; providers: string[] }> {
    this.logger.log(`Searching jobs across providers: ${JSON.stringify(params)}`);

    const results: Job[] = [];
    const activeProviders: string[] = [];

    // Search each provider in parallel
    const searchPromises = [
      this.linkedInService.searchJobs(params),
      this.indeedService.searchJobs(params),
      this.glassdoorService.searchJobs(params),
      this.remoteCoService.searchJobs(params),
      this.angelListService.searchJobs(params),
      this.diceService.searchJobs(params),
    ];

    const providerResults = await Promise.allSettled(searchPromises);
    const providerNames = ['LINKEDIN', 'INDEED', 'GLASSDOOR', 'REMOTE_CO', 'ANGEL_LIST', 'DICE'];

    providerResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value?.jobs) {
        results.push(...result.value.jobs);
        activeProviders.push(providerNames[index]);
      } else if (result.status === 'rejected') {
        this.logger.warn(`${providerNames[index]} search failed: ${result.reason}`);
      }
    });

    // Deduplicate jobs by source URL
    const uniqueJobs = this.deduplicateJobs(results);

    // Sort by posted date (newest first)
    uniqueJobs.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());

    return {
      jobs: uniqueJobs,
      providers: activeProviders,
    };
  }

  /**
   * Get jobs from a specific provider
   */
  async getJobsFromProvider(provider: string, params: JobSearchParams) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    switch (normalizedProvider) {
      case 'LINKEDIN':
        return this.linkedInService.searchJobs(params);
      case 'INDEED':
        return this.indeedService.searchJobs(params);
      case 'GLASSDOOR':
        return this.glassdoorService.searchJobs(params);
      case 'REMOTE_CO':
        return this.remoteCoService.searchJobs(params);
      case 'ANGEL_LIST':
        return this.angelListService.searchJobs(params);
      case 'DICE':
        return this.diceService.searchJobs(params);
      default:
        throw new NotFoundException(`Unknown job board provider: ${provider}`);
    }
  }

  /**
   * Apply to a job
   */
  async applyToJob(
    provider: string,
    jobId: string,
    resumeId: string,
    coverLetter?: string,
  ) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    // Get user credentials for the provider
    const credential = await this.prisma.jobBoardCredential.findUnique({
      where: {
        userId_provider: {
          userId: resumeId, // This should be user ID
          provider: normalizedProvider,
        },
      },
    });

    if (!credential) {
      throw new NotFoundException(`No credentials found for ${provider}`);
    }

    const credentials = this.encryptionService.decryptObject(credential.accessToken);

    switch (normalizedProvider) {
      case 'LINKEDIN':
        return this.linkedInService.applyToJob(credentials, jobId, resumeId, coverLetter);
      case 'INDEED':
        return this.indeedService.applyToJob(credentials, jobId, resumeId, coverLetter);
      case 'GLASSDOOR':
        return this.glassdoorService.applyToJob(credentials, jobId, resumeId, coverLetter);
      default:
        throw new NotFoundException(`Apply not supported for provider: ${provider}`);
    }
  }

  /**
   * Get all jobs saved by user
   */
  async getJobs(page = 1, limit = 20) {
    // This would query saved jobs from our database
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  /**
   * Store OAuth credentials for a user
   */
  async storeCredentials(
    userId: string,
    provider: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date,
  ) {
    const encryptedAccessToken = this.encryptionService.encrypt(accessToken);
    const encryptedRefreshToken = refreshToken
      ? this.encryptionService.encrypt(refreshToken)
      : null;

    return this.prisma.jobBoardCredential.upsert({
      where: {
        userId_provider: {
          userId,
          provider: provider.toUpperCase().replace('-', '_'),
        },
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider: provider.toUpperCase().replace('-', '_'),
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
      },
    });
  }

  /**
   * Get user credentials for a provider
   */
  async getCredentials(userId: string, provider: string) {
    const credential = await this.prisma.jobBoardCredential.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: provider.toUpperCase().replace('-', '_'),
        },
      },
    });

    if (!credential) {
      return null;
    }

    return {
      accessToken: this.encryptionService.decrypt(credential.accessToken),
      refreshToken: credential.refreshToken
        ? this.encryptionService.decrypt(credential.refreshToken)
        : null,
      expiresAt: credential.expiresAt,
    };
  }

  /**
   * Refresh OAuth token
   */
  async refreshToken(userId: string, provider: string) {
    const credentials = await this.getCredentials(userId, provider);
    if (!credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    let newCredentials;
    switch (normalizedProvider) {
      case 'LINKEDIN':
        newCredentials = await this.linkedInService.refreshToken(credentials.refreshToken);
        break;
      case 'INDEED':
        newCredentials = await this.indeedService.refreshToken(credentials.refreshToken);
        break;
      default:
        throw new Error(`Token refresh not supported for ${provider}`);
    }

    // Store new tokens
    await this.storeCredentials(
      userId,
      provider,
      newCredentials.accessToken,
      newCredentials.refreshToken,
      newCredentials.expiresAt,
    );

    return newCredentials;
  }

  /**
   * Deduplicate jobs by source URL
   */
  private deduplicateJobs(jobs: Job[]): Job[] {
    const seen = new Map<string, Job>();

    for (const job of jobs) {
      if (!seen.has(job.sourceUrl)) {
        seen.set(job.sourceUrl, job);
      }
    }

    return Array.from(seen.values());
  }
}
