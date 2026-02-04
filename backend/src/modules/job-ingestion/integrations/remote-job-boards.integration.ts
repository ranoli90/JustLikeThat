import { Injectable, Logger } from '@nestjs/common';
import { BaseJobSource, JobSourceConfig, SearchParams, SearchResult, RawJobData } from './base-job-source.interface';
import { JobSourceCategory, ComplianceLevel, SourceReliability, CostEffectiveness } from '../../../entities/job-source.entity';
import { JobPosting } from '../../../entities/job-posting.entity';

@Injectable()
export class RemoteCoIntegration extends BaseJobSource {
  readonly sourceName = 'Remote.co';
  readonly sourceId = 'remote_co';
  readonly category = JobSourceCategory.API_INTEGRATION;
  readonly complianceLevel = ComplianceLevel.MEDIUM;
  readonly reliability = SourceReliability.HIGH;
  readonly costEffectiveness = CostEffectiveness.HIGH;
  readonly requiresAuth = false;
  readonly isFree = true;

  private readonly logger = new Logger(RemoteCoIntegration.name);
  private readonly baseUrl = 'https://api.remote.co';

  async authenticate(): Promise<boolean> {
    this.isAuthenticated = true;
    return true;
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const { keywords, location, page = 1, limit = 25 } = params;

    try {
      const queryParams = new URLSearchParams({
        search: keywords || '',
        location: location || '',
        page: page.toString(),
        per_page: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/jobs?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Remote.co API error: ${response.status}`);
      }

      const data = await response.json();
      const jobs = this.transformRemoteCoJobs(data.data || []);

      return {
        jobs,
        total: data.total || jobs.length,
        page,
        limit,
        hasMore: page * limit < (data.total || jobs.length),
        rateLimitRemaining: this.rateLimitRemaining,
      };
    } catch (error) {
      this.logger.error('Remote.co search error', error);
      return { jobs: [], total: 0, page: 1, limit, hasMore: false };
    }
  }

  async fetchJobById(id: string): Promise<RawJobData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.transformRemoteCoJob(data);
    } catch (error) {
      this.logger.error(`Error fetching Remote.co job ${id}`, error);
      return null;
    }
  }

  private transformRemoteCoJobs(jobs: any[]): RawJobData[] {
    return jobs.map((job: any) => this.transformRemoteCoJob(job));
  }

  private transformRemoteCoJob(job: any): RawJobData {
    return {
      externalId: job.id?.toString(),
      title: job.title,
      description: job.description,
      company: job.company?.name,
      companyName: job.company?.name,
      companyId: job.company?.id?.toString(),
      location: job.location?.name,
      remote: true,
      remotePolicy: 'remote',
      jobType: job.job_type || 'Full-time',
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      salaryCurrency: job.salary_currency,
      postedDate: job.published_at,
      applyUrl: job.url,
      requirements: job.requirements || [],
      skills: job.tags || [],
      source: 'remote_co',
      sourceUrl: job.url,
      logoUrl: job.company?.logo,
      companyLogo: job.company?.logo,
    };
  }

  normalizeJob(job: RawJobData): JobPosting {
    const normalized = super.normalizeJob(job);
    (normalized as any).source = 'remote_co';
    (normalized as any).sourceUrl = job.sourceUrl;
    return normalized;
  }
}

@Injectable()
export class WeWorkRemotelyIntegration extends BaseJobSource {
  readonly sourceName = 'We Work Remotely';
  readonly sourceId = 'we_work_remotely';
  readonly category = JobSourceCategory.SCRAPER;
  readonly complianceLevel = ComplianceLevel.MEDIUM;
  readonly reliability = SourceReliability.MEDIUM;
  readonly costEffectiveness = CostEffectiveness.HIGH;
  readonly requiresAuth = false;
  readonly isFree = true;

  private readonly logger = new Logger(WeWorkRemotelyIntegration.name);
  private readonly baseUrl = 'https://weworkremotely.com';

  async authenticate(): Promise<boolean> {
    this.isAuthenticated = true;
    return true;
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const { keywords, page = 1, limit = 25 } = params;

    try {
      const queryParams = new URLSearchParams({
        search: keywords || '',
        page: page.toString(),
      });

      const response = await fetch(`${this.baseUrl}/remote-jobs/search?${queryParams}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`We Work Remotely API error: ${response.status}`);
      }

      const data = await response.json();
      const jobs = this.transformJobs(data.jobs || []);

      return {
        jobs,
        total: data.total || jobs.length,
        page,
        limit,
        hasMore: page * limit < (data.total || jobs.length),
        rateLimitRemaining: this.rateLimitRemaining,
      };
    } catch (error) {
      this.logger.error('We Work Remotely search error', error);
      return { jobs: [], total: 0, page: 1, limit, hasMore: false };
    }
  }

  async fetchJobById(id: string): Promise<RawJobData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/remote-jobs/${id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.transformJob(data);
    } catch (error) {
      this.logger.error(`Error fetching We Work Remotely job ${id}`, error);
      return null;
    }
  }

  private transformJobs(jobs: any[]): RawJobData[] {
    return jobs.map((job: any) => this.transformJob(job));
  }

  private transformJob(job: any): RawJobData {
    return {
      externalId: job.id?.toString(),
      title: job.title,
      description: job.description,
      company: job.company,
      companyName: job.company,
      location: job.location || 'Remote',
      remote: true,
      remotePolicy: 'remote',
      jobType: job.job_type || 'Full-time',
      postedDate: job.posted_at,
      applyUrl: job.url,
      requirements: job.requirements || [],
      skills: job.tags || [],
      source: 'we_work_remotely',
      sourceUrl: job.url,
    };
  }

  normalizeJob(job: RawJobData): JobPosting {
    const normalized = super.normalizeJob(job);
    (normalized as any).source = 'we_work_remotely';
    (normalized as any).sourceUrl = job.sourceUrl;
    return normalized;
  }
}
