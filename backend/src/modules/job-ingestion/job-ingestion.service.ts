import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobSource, JobSourceCategory, ComplianceLevel, SourceReliability, CostEffectiveness } from '../../entities/job-source.entity';
import { IngestionLog, IngestionStatus } from '../../entities/ingestion-log.entity';
import { JobPosting } from '../../entities/job-posting.entity';
import { JobNormalizationService } from './job-normalization.service';
import { RateLimitService, RateLimitInfo, CostInfo } from './rate-limit.service';
import { AbstractJobSource, RawJobData, SearchParams } from './integrations';

@Injectable()
export class JobIngestionService {
  private readonly logger = new Logger(JobIngestionService.name);
  private integrationRegistry: Map<string, AbstractJobSource> = new Map();

  constructor(
    @InjectRepository(JobSource)
    private jobSourceRepository: Repository<JobSource>,
    @InjectRepository(IngestionLog)
    private ingestionLogRepository: Repository<IngestionLog>,
    @InjectRepository(JobPosting)
    private jobPostingRepository: Repository<JobPosting>,
    private normalizationService: JobNormalizationService,
    private rateLimitService: RateLimitService,
  ) {}

  // Integration registration methods
  registerIntegration(sourceId: string, integration: AbstractJobSource): void {
    this.integrationRegistry.set(sourceId, integration);
    this.logger.log(`Registered integration: ${sourceId}`);
  }

  getIntegration(sourceId: string): AbstractJobSource | undefined {
    return this.integrationRegistry.get(sourceId);
  }

  getAllIntegrations(): AbstractJobSource[] {
    return Array.from(this.integrationRegistry.values());
  }

  async getJobSources(userId: string, query: any) {
    const { page = 1, size = 10 } = query;
    const [data, total] = await this.jobSourceRepository.findAndCount({
      skip: (page - 1) * size,
      take: size,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      pagination: {
        page,
        size,
        total,
        pages: Math.ceil(total / size),
      },
    };
  }

  async getJobSourceById(userId: string, id: string) {
    return this.jobSourceRepository.findOneBy({ id });
  }

  async createJobSource(userId: string, createJobSourceDto: any) {
    const jobSource = this.jobSourceRepository.create(createJobSourceDto);
    return this.jobSourceRepository.save(jobSource);
  }

  async updateJobSource(userId: string, id: string, updateJobSourceDto: any) {
    await this.jobSourceRepository.update(id, updateJobSourceDto);
    return this.jobSourceRepository.findOneBy({ id });
  }

  async deleteJobSource(userId: string, id: string) {
    const result = await this.jobSourceRepository.delete(id);
    return { deleted: result.affected ? result.affected > 0 : false };
  }

  async getJobPostings(userId: string, query: any) {
    const { page = 1, size = 10 } = query;
    const [data, total] = await this.jobPostingRepository.findAndCount({
      skip: (page - 1) * size,
      take: size,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      pagination: {
        page,
        size,
        total,
        pages: Math.ceil(total / size),
      },
    };
  }

  async getJobPostingById(userId: string, id: string) {
    return this.jobPostingRepository.findOneBy({ id });
  }

  async ingestJobs(userId: string, ingestDto: any) {
    const { sourceId, keywords, location } = ingestDto;
    
    const jobSource = await this.jobSourceRepository.findOneBy({ id: sourceId });
    if (!jobSource) {
      throw new Error('Job source not found');
    }

    if (!jobSource.isAllowed) {
      throw new Error('Job source is forbidden');
    }

    const ingestionLog = this.ingestionLogRepository.create({
      jobSourceId: sourceId,
      status: IngestionStatus.RUNNING,
      metadata: { keywords, location },
    });
    await this.ingestionLogRepository.save(ingestionLog);

    try {
      const jobs = await this.fetchJobsFromSource(jobSource, keywords, location);
      const { ingested, duplicated, rejected } = await this.processJobs(jobs);

      ingestionLog.status = IngestionStatus.SUCCESS;
      ingestionLog.jobsIngested = ingested;
      ingestionLog.jobsDuplicated = duplicated;
      ingestionLog.jobsRejected = rejected;
    } catch (error) {
      this.logger.error('Ingestion failed', error);
      ingestionLog.status = IngestionStatus.FAILED;
      ingestionLog.error = error.message;
    }

    await this.ingestionLogRepository.save(ingestionLog);

    return ingestionLog;
  }

  async ingestFromIntegration(userId: string, sourceId: string, searchParams: SearchParams) {
    const integration = this.integrationRegistry.get(sourceId);
    if (!integration) {
      throw new Error(`Integration not found: ${sourceId}`);
    }

    // Check rate limit
    const rateLimitInfo = this.rateLimitService.checkRateLimit(sourceId);
    if (rateLimitInfo.remaining <= 0) {
      await this.rateLimitService.waitForRateLimit(sourceId);
    }

    try {
      // Authenticate if needed
      if (integration.requiresAuth) {
        await integration.authenticate();
      }

      // Search for jobs
      const result = await integration.search(searchParams);
      
      // Record cost
      this.rateLimitService.recordRequest(sourceId, result.jobs.length);

      // Normalize jobs
      const { normalized, stats } = this.normalizationService.normalizeBatch(result.jobs);

      // Save to database
      const ingested = await this.saveNormalizedJobs(normalized, sourceId);

      return {
        success: true,
        jobsFound: result.jobs.length,
        jobsIngested: ingested,
        stats,
        rateLimit: rateLimitInfo,
      };
    } catch (error) {
      this.logger.error(`Ingestion failed for ${sourceId}`, error);
      throw error;
    }
  }

  async getIngestionStatus(userId: string, jobId: string) {
    return this.ingestionLogRepository.findOneBy({ id: jobId });
  }

  async getRateLimitInfo(sourceId: string): Promise<RateLimitInfo> {
    return this.rateLimitService.checkRateLimit(sourceId);
  }

  async getCostInfo(sourceId: string): Promise<CostInfo> {
    return this.rateLimitService.getCostInfo(sourceId);
  }

  async getTotalCost() {
    return this.rateLimitService.getTotalCost();
  }

  async getOptimizationRecommendations() {
    return this.rateLimitService.getOptimizationRecommendations();
  }

  private async fetchJobsFromSource(jobSource: JobSource, keywords?: string, location?: string): Promise<RawJobData[]> {
    this.logger.log(`Fetching jobs from ${jobSource.name} (${jobSource.category})`);

    const integration = this.integrationRegistry.get(jobSource.id);
    if (integration) {
      const result = await integration.search({ keywords, location });
      return result.jobs;
    }

    switch (jobSource.category) {
      case JobSourceCategory.API_INTEGRATION:
        return this.fetchFromAPI(jobSource, keywords, location);
      case JobSourceCategory.SCRAPER:
        return this.fetchFromScraper(jobSource, keywords, location);
      case JobSourceCategory.EMAIL_APP:
        return this.fetchFromEmail(jobSource, keywords, location);
      case JobSourceCategory.USER_AUTOFILL:
        return this.fetchFromUserAutofill(jobSource, keywords, location);
      default:
        throw new Error('Unsupported job source category');
    }
  }

  private async fetchFromAPI(jobSource: JobSource, keywords?: string, location?: string): Promise<RawJobData[]> {
    const { apiUrl, apiKey, endpoint } = jobSource.config;
    
    this.logger.log(`Calling API: ${apiUrl}/${endpoint}`);
    
    try {
      const response = await fetch(`${apiUrl}/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ keywords, location }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.jobs || [];
    } catch (error) {
      this.logger.error('API fetch error', error);
      return [];
    }
  }

  private async fetchFromScraper(jobSource: JobSource, keywords?: string, location?: string): Promise<RawJobData[]> {
    this.logger.log(`Fetching jobs from scraper: ${jobSource.name}`);
    return [];
  }

  private async fetchFromEmail(jobSource: JobSource, keywords?: string, location?: string): Promise<RawJobData[]> {
    this.logger.log(`Fetching jobs from email app: ${jobSource.name}`);
    return [];
  }

  private async fetchFromUserAutofill(jobSource: JobSource, keywords?: string, location?: string): Promise<RawJobData[]> {
    this.logger.log(`Fetching jobs from user autofill: ${jobSource.name}`);
    return [];
  }

  private async processJobs(jobs: RawJobData[]): Promise<{ ingested: number; duplicated: number; rejected: number }> {
    let ingested = 0;
    let duplicated = 0;
    let rejected = 0;

    for (const jobData of jobs) {
      if (await this.isDuplicate(jobData)) {
        duplicated++;
        continue;
      }

      if (!this.isJobValid(jobData)) {
        rejected++;
        continue;
      }

      await this.saveJob(jobData);
      ingested++;
    }

    return { ingested, duplicated, rejected };
  }

  private async saveNormalizedJobs(jobs: any[], sourceId: string): Promise<number> {
    let ingested = 0;
    
    for (const normalizedJob of jobs) {
      try {
        const jobPosting = this.jobPostingRepository.create(normalizedJob as Partial<JobPosting>);
        await this.jobPostingRepository.save(jobPosting);
        ingested++;
      } catch (error) {
        this.logger.error('Failed to save normalized job', error);
      }
    }
    
    return ingested;
  }

  private async isDuplicate(jobData: RawJobData): Promise<boolean> {
    const applyUrl = jobData.applyUrl || jobData.applicationUrl;
    if (!applyUrl) return false;

    const existingJob = await this.jobPostingRepository.findOneBy({ applyUrl });
    return !!existingJob;
  }

  private isJobValid(jobData: RawJobData): boolean {
    if (!jobData.title || !jobData.company) {
      return false;
    }

    if (jobData.title.length < 3 || jobData.company.length < 2) {
      return false;
    }

    return true;
  }

  private async saveJob(jobData: RawJobData): Promise<JobPosting> {
    const jobPosting = this.jobPostingRepository.create(jobData as any);
    return this.jobPostingRepository.save(jobPosting);
  }

  async handleIngestionFailure(ingestionLog: IngestionLog): Promise<void> {
    if (ingestionLog.retryCount >= ingestionLog.jobSource.maxRetries) {
      this.logger.error(`Max retries reached for ingestion log: ${ingestionLog.id}`);
      return;
    }

    ingestionLog.retryCount++;
    ingestionLog.status = IngestionStatus.RETRYING;
    await this.ingestionLogRepository.save(ingestionLog);

    setTimeout(async () => {
      try {
        const jobSource = await this.jobSourceRepository.findOneBy({ id: ingestionLog.jobSourceId });
        if (!jobSource) {
          throw new Error('Job source not found for retry');
        }
        
        const jobs = await this.fetchJobsFromSource(jobSource);
        const { ingested, duplicated, rejected } = await this.processJobs(jobs);

        ingestionLog.status = IngestionStatus.SUCCESS;
        ingestionLog.jobsIngested = ingested;
        ingestionLog.jobsDuplicated = duplicated;
        ingestionLog.jobsRejected = rejected;
      } catch (error) {
        this.logger.error('Retry failed', error);
        ingestionLog.status = IngestionStatus.FAILED;
        ingestionLog.error = error.message;
      }

      await this.ingestionLogRepository.save(ingestionLog);
    }, ingestionLog.jobSource.retryDelay * 1000);
  }

  getRiskMatrix(): any {
    return {
      allowedPlatforms: {
        API_INTEGRATION: ['LinkedIn', 'Indeed', 'Glassdoor', 'Greenhouse', 'Lever', 'Workday'],
        SCRAPER: ['Remote.co', 'We Work Remotely', 'TechCrunch'],
        EMAIL_APP: ['Gmail', 'Outlook', 'Yahoo Mail'],
        USER_AUTOFILL: ['Chrome', 'Firefox', 'Safari'],
      },
      forbiddenPlatforms: {
        API_INTEGRATION: ['Unknown API', 'Unverified Job Board'],
        SCRAPER: ['Suspicious Scraper'],
        EMAIL_APP: ['Suspicious Email Service'],
        USER_AUTOFILL: ['Malicious Browser Extension'],
      },
      complianceLevels: {
        HIGH: ['LinkedIn', 'Indeed', 'Greenhouse', 'Lever', 'Workday'],
        MEDIUM: ['Glassdoor', 'Remote.co', 'AngelList'],
        LOW: ['Other Job Boards', 'Generic Scrapers'],
      },
    };
  }

  getCostChecklist(): any {
    return [
      { item: 'Rate limiting implemented', completed: true },
      { item: 'Cost-effective sources prioritized', completed: true },
      { item: 'API call optimization', completed: true },
      { item: 'Caching mechanism enabled', completed: false },
      { item: 'Cost monitoring setup', completed: true },
    ];
  }

  get10SourcePlan(): any {
    return [
      { name: 'LinkedIn API', category: 'API_INTEGRATION', complianceLevel: 'HIGH', reliability: 'CRITICAL', costEffectiveness: 'HIGH' },
      { name: 'Indeed API', category: 'API_INTEGRATION', complianceLevel: 'HIGH', reliability: 'CRITICAL', costEffectiveness: 'HIGH' },
      { name: 'Glassdoor API', category: 'API_INTEGRATION', complianceLevel: 'MEDIUM', reliability: 'HIGH', costEffectiveness: 'MEDIUM' },
      { name: 'Greenhouse', category: 'API_INTEGRATION', complianceLevel: 'HIGH', reliability: 'HIGH', costEffectiveness: 'HIGH' },
      { name: 'Lever', category: 'API_INTEGRATION', complianceLevel: 'HIGH', reliability: 'HIGH', costEffectiveness: 'HIGH' },
      { name: 'Remote.co', category: 'SCRAPER', complianceLevel: 'MEDIUM', reliability: 'MEDIUM', costEffectiveness: 'HIGH' },
      { name: 'We Work Remotely', category: 'SCRAPER', complianceLevel: 'MEDIUM', reliability: 'MEDIUM', costEffectiveness: 'HIGH' },
      { name: 'AngelList', category: 'API_INTEGRATION', complianceLevel: 'MEDIUM', reliability: 'HIGH', costEffectiveness: 'HIGH' },
      { name: 'Dice', category: 'API_INTEGRATION', complianceLevel: 'MEDIUM', reliability: 'HIGH', costEffectiveness: 'MEDIUM' },
      { name: 'Workday', category: 'API_INTEGRATION', complianceLevel: 'HIGH', reliability: 'HIGH', costEffectiveness: 'MEDIUM' },
    ];
  }

  getAvailableIntegrations(): any[] {
    return [
      { id: 'linkedin', name: 'LinkedIn', category: 'API_INTEGRATION', free: false, requiresAuth: true },
      { id: 'indeed', name: 'Indeed', category: 'API_INTEGRATION', free: false, requiresAuth: true },
      { id: 'glassdoor', name: 'Glassdoor', category: 'API_INTEGRATION', free: false, requiresAuth: true },
      { id: 'greenhouse', name: 'Greenhouse', category: 'API_INTEGRATION', free: true, requiresAuth: true },
      { id: 'lever', name: 'Lever', category: 'API_INTEGRATION', free: true, requiresAuth: true },
      { id: 'workday', name: 'Workday', category: 'API_INTEGRATION', free: false, requiresAuth: true },
      { id: 'remote_co', name: 'Remote.co', category: 'SCRAPER', free: true, requiresAuth: false },
      { id: 'we_work_remotely', name: 'We Work Remotely', category: 'SCRAPER', free: true, requiresAuth: false },
      { id: 'angellist', name: 'AngelList (Wellfound)', category: 'API_INTEGRATION', free: true, requiresAuth: false },
      { id: 'dice', name: 'Dice', category: 'API_INTEGRATION', free: false, requiresAuth: true },
      { id: 'techcrunch', name: 'TechCrunch', category: 'SCRAPER', free: true, requiresAuth: false },
    ];
  }
}
