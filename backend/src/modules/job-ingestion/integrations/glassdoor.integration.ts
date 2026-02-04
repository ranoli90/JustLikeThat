import { Injectable, Logger } from '@nestjs/common';
import { BaseJobSource, JobSourceConfig, SearchParams, SearchResult, RawJobData } from './base-job-source.interface';
import { JobSourceCategory, ComplianceLevel, SourceReliability, CostEffectiveness } from '../../../entities/job-source.entity';
import { JobPosting } from '../../../entities/job-posting.entity';

@Injectable()
export class GlassdoorIntegration extends BaseJobSource {
  readonly sourceName = 'Glassdoor';
  readonly sourceId = 'glassdoor';
  readonly category = JobSourceCategory.API_INTEGRATION;
  readonly complianceLevel = ComplianceLevel.MEDIUM;
  readonly reliability = SourceReliability.HIGH;
  readonly costEffectiveness = CostEffectiveness.MEDIUM;
  readonly requiresAuth = true;
  readonly isFree = false;

  private readonly logger = new Logger(GlassdoorIntegration.name);
  private readonly baseUrl = 'https://api.glassdoor.com/api/android/v1';
  private clientId: string = '';
  private clientSecret: string = '';

  configure(config: JobSourceConfig): void {
    super.configure(config);
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret || '';
  }

  async authenticate(): Promise<boolean> {
    const token = this.config.accessToken;
    if (token && token.length > 10) {
      this.isAuthenticated = true;
      this.logger.log('Glassdoor authentication successful');
      return true;
    }
    this.logger.warn('Glassdoor authentication failed - no access token');
    return false;
  }

  async search(params: SearchParams): Promise<SearchResult> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    const { keywords, location, page = 1, limit = 20 } = params;
    const accessToken = this.config.accessToken || '';

    try {
      const queryParams = new URLSearchParams({
        v: '1',
        format: 'json',
        aid: this.clientId,
        s: 'relevance',
        p: page.toString(),
        ps: Math.min(limit, 50).toString(),
        q: keywords || '',
        l: location || '',
      });

      const response = await fetch(`${this.baseUrl}/jobs.htm?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'gd-csrf-token': 'cross-domain',
        },
      });

      if (!response.ok) {
        throw new Error(`Glassdoor API error: ${response.status}`);
      }

      const data = await response.json();
      const jobs = this.transformGlassdoorJobs(data.response?.jobs || []);
      
      this.rateLimitRemaining = Math.max(0, this.rateLimitRemaining - 1);

      return {
        jobs,
        total: data.response?.totalRecordCount || jobs.length,
        page,
        limit,
        hasMore: page * limit < (data.response?.totalRecordCount || jobs.length),
        creditsUsed: jobs.length,
        rateLimitRemaining: this.rateLimitRemaining,
      };
    } catch (error) {
      this.logger.error('Glassdoor search error', error);
      return { jobs: [], total: 0, page: 1, limit, hasMore: false };
    }
  }

  async fetchJobById(id: string): Promise<RawJobData | null> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    const accessToken = this.config.accessToken || '';

    try {
      const response = await fetch(`${this.baseUrl}/job.htm?jobId=${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.transformGlassdoorJob(data.response?.job || null);
    } catch (error) {
      this.logger.error(`Error fetching Glassdoor job ${id}`, error);
      return null;
    }
  }

  private transformGlassdoorJobs(jobs: any[]): RawJobData[] {
    return jobs.map((job: any) => this.transformGlassdoorJob(job));
  }

  private transformGlassdoorJob(job: any): RawJobData {
    return {
      externalId: job.jobId?.toString(),
      title: job.jobTitle || job.title,
      description: job.description || job.snippet,
      company: job.employer?.name || job.employerName,
      companyName: job.employer?.name || job.employerName,
      companyId: job.employer?.id?.toString(),
      location: job.location || job.formattedLocation,
      city: job.city,
      state: job.state,
      country: job.country,
      remote: job.remote?.toLowerCase() === 'true',
      remotePolicy: job.workFromHome?.toLowerCase() === 'true' ? 'remote' : 'onsite',
      jobType: this.mapJobType(job.employmentType),
      salaryMin: job.salary?.minSalary || job.salaryLow,
      salaryMax: job.salary?.maxSalary || job.salaryHigh,
      salaryCurrency: 'USD',
      postedDate: job.date || job.postedDate,
      applyUrl: job.applyUrl || job.url,
      applicationDeadline: job.expirationDate,
      requirements: job.requirements || [],
      skills: job.skills || [],
      tags: job.jobTypes || [],
      logoUrl: job.employer?.logo,
      companyLogo: job.employer?.logo,
      source: 'glassdoor',
      sourceUrl: `https://www.glassdoor.com/job/${job.jobId}`,
    };
  }

  private mapJobType(employmentType: string | undefined): string {
    const typeMap: Record<string, string> = {
      'fulltime': 'Full-time',
      'parttime': 'Part-time',
      'contract': 'Contract',
      'temporary': 'Temporary',
      'internship': 'Internship',
    };
    return typeMap[employmentType?.toLowerCase() || ''] || 'Full-time';
  }

  normalizeJob(job: RawJobData): JobPosting {
    const normalized = super.normalizeJob(job);
    (normalized as any).glassdoorJobId = job.externalId;
    (normalized as any).source = 'glassdoor';
    (normalized as any).sourceUrl = job.sourceUrl;
    (normalized as any).logoUrl = job.companyLogo;
    return normalized;
  }
}
