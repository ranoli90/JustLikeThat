import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobSource, JobSourceCategory, ComplianceLevel, SourceReliability, CostEffectiveness } from '../../entities/job-source.entity';
import { IngestionLog, IngestionStatus } from '../../entities/ingestion-log.entity';
import { JobPosting } from '../../entities/job-posting.entity';

@Injectable()
export class JobIngestionService {
  private readonly logger = new Logger(JobIngestionService.name);

  constructor(
    @InjectRepository(JobSource)
    private jobSourceRepository: Repository<JobSource>,
    @InjectRepository(IngestionLog)
    private ingestionLogRepository: Repository<IngestionLog>,
    @InjectRepository(JobPosting)
    private jobPostingRepository: Repository<JobPosting>,
  ) {}

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

  async getIngestionStatus(userId: string, jobId: string) {
    return this.ingestionLogRepository.findOneBy({ id: jobId });
  }

  private async fetchJobsFromSource(jobSource: JobSource, keywords?: string, location?: string): Promise<any[]> {
    this.logger.log(`Fetching jobs from ${jobSource.name} (${jobSource.category})`);

    switch (jobSource.category) {
      case JobSourceCategory.API_INTEGRATION:
        return this.fetchFromAPI(jobSource, keywords, location);
      case JobSourceCategory.EMAIL_APP:
        return this.fetchFromEmail(jobSource, keywords, location);
      case JobSourceCategory.USER_AUTOFILL:
        return this.fetchFromUserAutofill(jobSource, keywords, location);
      default:
        throw new Error('Unsupported job source category');
    }
  }

  private async fetchFromAPI(jobSource: JobSource, keywords?: string, location?: string): Promise<any[]> {
    const { apiUrl, apiKey, endpoint } = jobSource.config;
    
    this.logger.log(`Calling API: ${apiUrl}/${endpoint}`);
    
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
  }

  private async fetchFromEmail(jobSource: JobSource, keywords?: string, location?: string): Promise<any[]> {
    this.logger.log(`Fetching jobs from email app: ${jobSource.name}`);
    
    return [];
  }

  private async fetchFromUserAutofill(jobSource: JobSource, keywords?: string, location?: string): Promise<any[]> {
    this.logger.log(`Fetching jobs from user autofill: ${jobSource.name}`);
    
    return [];
  }

  private async processJobs(jobs: any[]): Promise<{ ingested: number; duplicated: number; rejected: number }> {
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

  private async isDuplicate(jobData: any): Promise<boolean> {
    const existingJob = await this.jobPostingRepository.findOneBy({
      applyUrl: jobData.applyUrl,
    });

    return !!existingJob;
  }

  private isJobValid(jobData: any): boolean {
    if (!jobData.title || !jobData.company || !jobData.applyUrl) {
      return false;
    }

    if (jobData.title.length < 3 || jobData.company.length < 2) {
      return false;
    }

    return true;
  }

  private async saveJob(jobData: any): Promise<JobPosting> {
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
        API_INTEGRATION: ['LinkedIn', 'Indeed', 'Glassdoor', 'Monster', 'CareerBuilder'],
        EMAIL_APP: ['Gmail', 'Outlook', 'Yahoo Mail'],
        USER_AUTOFILL: ['Chrome', 'Firefox', 'Safari'],
      },
      forbiddenPlatforms: {
        API_INTEGRATION: ['Unknown API', 'Unverified Job Board'],
        EMAIL_APP: ['Suspicious Email Service'],
        USER_AUTOFILL: ['Malicious Browser Extension'],
      },
      complianceLevels: {
        HIGH: ['LinkedIn', 'Indeed'],
        MEDIUM: ['Glassdoor', 'Monster', 'CareerBuilder'],
        LOW: ['Other Job Boards'],
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
      { name: 'Monster API', category: 'API_INTEGRATION', complianceLevel: 'MEDIUM', reliability: 'HIGH', costEffectiveness: 'MEDIUM' },
      { name: 'CareerBuilder API', category: 'API_INTEGRATION', complianceLevel: 'MEDIUM', reliability: 'HIGH', costEffectiveness: 'MEDIUM' },
      { name: 'Gmail Integration', category: 'EMAIL_APP', complianceLevel: 'LOW', reliability: 'MEDIUM', costEffectiveness: 'LOW' },
      { name: 'Outlook Integration', category: 'EMAIL_APP', complianceLevel: 'LOW', reliability: 'MEDIUM', costEffectiveness: 'LOW' },
      { name: 'Chrome Autofill', category: 'USER_AUTOFILL', complianceLevel: 'LOW', reliability: 'LOW', costEffectiveness: 'VERY_HIGH' },
      { name: 'Firefox Autofill', category: 'USER_AUTOFILL', complianceLevel: 'LOW', reliability: 'LOW', costEffectiveness: 'VERY_HIGH' },
      { name: 'Safari Autofill', category: 'USER_AUTOFILL', complianceLevel: 'LOW', reliability: 'LOW', costEffectiveness: 'VERY_HIGH' },
    ];
  }
}
