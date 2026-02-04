import { Injectable, Logger } from '@nestjs/common';
import { BaseJobSource, JobSourceConfig, SearchParams, SearchResult, RawJobData } from './base-job-source.interface';
import { JobSourceCategory, ComplianceLevel, SourceReliability, CostEffectiveness } from '../../../entities/job-source.entity';
import { JobPosting } from '../../../entities/job-posting.entity';

@Injectable()
export class GreenhouseIntegration extends BaseJobSource {
  readonly sourceName = 'Greenhouse';
  readonly sourceId = 'greenhouse';
  readonly category = JobSourceCategory.API_INTEGRATION;
  readonly complianceLevel = ComplianceLevel.HIGH;
  readonly reliability = SourceReliability.HIGH;
  readonly costEffectiveness = CostEffectiveness.HIGH;
  readonly requiresAuth = true;
  readonly isFree = false;

  private readonly logger = new Logger(GreenhouseIntegration.name);
  private readonly baseUrl = 'https://harvest.greenhouse.io/v1';
  private apiKey: string = '';
  private boardToken: string = '';

  configure(config: JobSourceConfig): void {
    super.configure(config);
    this.apiKey = config.apiKey || config.accessToken || '';
    this.boardToken = config.clientId || '';
  }

  async authenticate(): Promise<boolean> {
    if (this.apiKey && this.apiKey.length > 5) {
      this.isAuthenticated = true;
      this.logger.log('Greenhouse authentication successful');
      return true;
    }
    this.logger.warn('Greenhouse authentication failed - no API key');
    return false;
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const { keywords, page = 1, limit = 25 } = params;

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        per_page: limit.toString(),
      });

      if (keywords) {
        queryParams.append('q', keywords);
      }

      const response = await fetch(`${this.baseUrl}/boards/${this.boardToken}/jobs?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Greenhouse API error: ${response.status}`);
      }

      const data = await response.json();
      const jobs = this.transformGreenhouseJobs(data.jobs || []);

      return {
        jobs,
        total: data.meta?.total || jobs.length,
        page,
        limit,
        hasMore: page * limit < (data.meta?.total || jobs.length),
        creditsUsed: 1,
        rateLimitRemaining: this.rateLimitRemaining,
      };
    } catch (error) {
      this.logger.error('Greenhouse search error', error);
      return { jobs: [], total: 0, page: 1, limit, hasMore: false };
    }
  }

  async fetchJobById(id: string): Promise<RawJobData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/boards/${this.boardToken}/jobs/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.transformGreenhouseJob(data);
    } catch (error) {
      this.logger.error(`Error fetching Greenhouse job ${id}`, error);
      return null;
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const credentials = Buffer.from(`${this.apiKey}:`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  private transformGreenhouseJobs(jobs: any[]): RawJobData[] {
    return jobs.map((job: any) => this.transformGreenhouseJob(job));
  }

  private transformGreenhouseJob(job: any): RawJobData {
    return {
      externalId: job.id?.toString(),
      title: job.title,
      description: job.description,
      company: job.board?.name,
      companyName: job.board?.name,
      location: job.location?.name || job.location,
      remote: job.remote?.toLowerCase() === 'true',
      remotePolicy: job.remote ? 'remote' : 'onsite',
      jobType: job.employment_type || 'Full-time',
      salaryMin: job.salary?.min || job.salary_min,
      salaryMax: job.salary?.max || job.salary_max,
      salaryCurrency: 'USD',
      postedDate: job.updated_at || job.created_at,
      applyUrl: job.absolute_url,
      applicationDeadline: job.closed_at,
      requirements: this.extractRequirements(job),
      skills: job.technology_tags?.map((tag: any) => tag.name) || [],
      source: 'greenhouse',
      sourceUrl: job.absolute_url,
    };
  }

  private extractRequirements(job: any): string[] {
    const requirements: string[] = [];
    if (job.metadata) {
      for (const meta of job.metadata) {
        if (meta.name?.toLowerCase().includes('requirement')) {
          requirements.push(meta.value);
        }
      }
    }
    return requirements;
  }

  normalizeJob(job: RawJobData): JobPosting {
    const normalized = super.normalizeJob(job);
    (normalized as any).source = 'greenhouse';
    (normalized as any).sourceUrl = job.sourceUrl;
    return normalized;
  }
}

@Injectable()
export class LeverIntegration extends BaseJobSource {
  readonly sourceName = 'Lever';
  readonly sourceId = 'lever';
  readonly category = JobSourceCategory.API_INTEGRATION;
  readonly complianceLevel = ComplianceLevel.HIGH;
  readonly reliability = SourceReliability.HIGH;
  readonly costEffectiveness = CostEffectiveness.HIGH;
  readonly requiresAuth = true;
  readonly isFree = false;

  private readonly logger = new Logger(LeverIntegration.name);
  private readonly baseUrl = 'https://api.lever.co/v1';
  private apiKey: string = '';
  private siteId: string = '';

  configure(config: JobSourceConfig): void {
    super.configure(config);
    this.apiKey = config.apiKey || config.accessToken || '';
    this.siteId = config.clientId || '';
  }

  async authenticate(): Promise<boolean> {
    if (this.apiKey && this.apiKey.length > 5) {
      this.isAuthenticated = true;
      this.logger.log('Lever authentication successful');
      return true;
    }
    this.logger.warn('Lever authentication failed - no API key');
    return false;
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const { keywords, location, page = 0, limit = 25 } = params;

    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });

      if (keywords) {
        queryParams.append('q', keywords);
      }
      if (location) {
        queryParams.append('location', location);
      }

      const response = await fetch(`${this.baseUrl}/postings/${this.siteId}?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Lever API error: ${response.status}`);
      }

      const data = await response.json();
      const jobs = this.transformLeverJobs(data.data || []);

      return {
        jobs,
        total: data.hasNext ? -1 : jobs.length,
        page: page + 1,
        limit,
        hasMore: data.hasNext || false,
        creditsUsed: 1,
        rateLimitRemaining: this.rateLimitRemaining,
      };
    } catch (error) {
      this.logger.error('Lever search error', error);
      return { jobs: [], total: 0, page: 1, limit, hasMore: false };
    }
  }

  async fetchJobById(id: string): Promise<RawJobData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/postings/${this.siteId}/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.transformLeverJob(data.data);
    } catch (error) {
      this.logger.error(`Error fetching Lever job ${id}`, error);
      return null;
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const credentials = Buffer.from(`${this.apiKey}:`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  private transformLeverJobs(postings: any[]): RawJobData[] {
    return postings.map((posting: any) => this.transformLeverJob(posting));
  }

  private transformLeverJob(posting: any): RawJobData {
    return {
      externalId: posting.id,
      title: posting.text,
      description: posting.description || posting.html,
      company: posting.hostedSite?.name || this.siteId,
      companyName: posting.hostedSite?.name || this.siteId,
      location: posting.categories?.location || posting.location,
      remote: posting.remote?.toLowerCase() === 'true',
      remotePolicy: posting.remote ? 'remote' : 'onsite',
      jobType: posting.categories?.commitment || 'Full-time',
      salaryMin: posting.salary?.min,
      salaryMax: posting.salary?.max,
      salaryCurrency: posting.salary?.currency,
      postedDate: posting.createdAt,
      applyUrl: posting.applyUrl,
      applicationDeadline: posting.closedAt,
      requirements: this.extractRequirements(posting),
      skills: posting.tagging?.tags || [],
      tags: posting.categories?.teams || [],
      source: 'lever',
      sourceUrl: posting.applyUrl,
    };
  }

  private extractRequirements(posting: any): string[] {
    const requirements: string[] = [];
    if (posting.descriptionPlain) {
      requirements.push(posting.descriptionPlain);
    }
    return requirements;
  }

  normalizeJob(job: RawJobData): JobPosting {
    const normalized = super.normalizeJob(job);
    (normalized as any).source = 'lever';
    (normalized as any).sourceUrl = job.sourceUrl;
    return normalized;
  }
}

@Injectable()
export class WorkdayIntegration extends BaseJobSource {
  readonly sourceName = 'Workday';
  readonly sourceId = 'workday';
  readonly category = JobSourceCategory.API_INTEGRATION;
  readonly complianceLevel = ComplianceLevel.HIGH;
  readonly reliability = SourceReliability.HIGH;
  readonly costEffectiveness = CostEffectiveness.MEDIUM;
  readonly requiresAuth = true;
  readonly isFree = false;

  private readonly logger = new Logger(WorkdayIntegration.name);
  private readonly baseUrl = 'https://api.workday.com/v1';
  private tenantId: string = '';
  private clientId: string = '';
  private clientSecret: string = '';

  configure(config: JobSourceConfig): void {
    super.configure(config);
    this.tenantId = config.clientId || '';
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret || '';
  }

  async authenticate(): Promise<boolean> {
    const token = this.config.accessToken;
    if (token && token.length > 10) {
      this.isAuthenticated = true;
      this.logger.log('Workday authentication successful');
      return true;
    }
    this.logger.warn('Workday authentication failed - no access token');
    return false;
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const { keywords, location, page = 1, limit = 25 } = params;
    const accessToken = this.config.accessToken || '';

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (keywords) {
        queryParams.append('q', keywords);
      }
      if (location) {
        queryParams.append('location', location);
      }

      const response = await fetch(`${this.baseUrl}/jobs?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(`Workday API error: ${response.status}`);
      }

      const data = await response.json();
      const jobs = this.transformWorkdayJobs(data.data || []);

      return {
        jobs,
        total: data.total || jobs.length,
        page,
        limit,
        hasMore: page * limit < (data.total || jobs.length),
        creditsUsed: jobs.length,
        rateLimitRemaining: this.rateLimitRemaining,
      };
    } catch (error) {
      this.logger.error('Workday search error', error);
      return { jobs: [], total: 0, page: 1, limit, hasMore: false };
    }
  }

  async fetchJobById(id: string): Promise<RawJobData | null> {
    const accessToken = this.config.accessToken || '';

    try {
      const response = await fetch(`${this.baseUrl}/jobs/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(accessToken),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.transformWorkdayJob(data.data);
    } catch (error) {
      this.logger.error(`Error fetching Workday job ${id}`, error);
      return null;
    }
  }

  private getAuthHeaders(accessToken: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Tenant': this.tenantId,
    };
  }

  private transformWorkdayJobs(jobs: any[]): RawJobData[] {
    return jobs.map((job: any) => this.transformWorkdayJob(job));
  }

  private transformWorkdayJob(job: any): RawJobData {
    return {
      externalId: job.id,
      title: job.title || job.descriptor,
      description: job.description,
      company: job.primaryLocation,
      companyName: job.primaryLocation,
      location: job.primaryLocation,
      remote: job.remoteWorkType?.toLowerCase() === 'remote',
      remotePolicy: job.remoteWorkType || 'onsite',
      jobType: job.type || 'Full-time',
      salaryMin: job.payRange?.min || job.salaryRange?.min,
      salaryMax: job.payRange?.max || job.salaryRange?.max,
      salaryCurrency: 'USD',
      postedDate: job.postedDate || job.created,
      applyUrl: job.applyUrl,
      applicationDeadline: job.expirationDate,
      requirements: job.requirements || [],
      skills: job.skillRequirements?.map((s: any) => s.name) || [],
      source: 'workday',
      sourceUrl: job.applyUrl,
    };
  }

  normalizeJob(job: RawJobData): JobPosting {
    const normalized = super.normalizeJob(job);
    (normalized as any).source = 'workday';
    (normalized as any).sourceUrl = job.sourceUrl;
    return normalized;
  }
}
