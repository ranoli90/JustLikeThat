import { Injectable, Logger } from '@nestjs/common';
import { BaseJobSource, JobSourceConfig, SearchParams, SearchResult, RawJobData } from './base-job-source.interface';
import { JobSourceCategory, ComplianceLevel, SourceReliability, CostEffectiveness } from '../../../entities/job-source.entity';
import { JobPosting } from '../../../entities/job-posting.entity';

@Injectable()
export class IndeedIntegration extends BaseJobSource {
  readonly sourceName = 'Indeed';
  readonly sourceId = 'indeed';
  readonly category = JobSourceCategory.API_INTEGRATION;
  readonly complianceLevel = ComplianceLevel.HIGH;
  readonly reliability = SourceReliability.CRITICAL;
  readonly costEffectiveness = CostEffectiveness.HIGH;
  readonly requiresAuth = true;
  readonly isFree = false;

  private readonly logger = new Logger(IndeedIntegration.name);
  private readonly baseUrl = 'https://api.indeed.com/ads/apisearch';
  private publisherId: string = '';
  private apiKey: string = '';

  configure(config: JobSourceConfig): void {
    super.configure(config);
    this.publisherId = config.clientId || config.apiKey || '';
    this.apiKey = config.clientSecret || config.apiKey || '';
  }

  async authenticate(): Promise<boolean> {
    // Indeed uses publisher ID for authentication
    if (this.publisherId && this.publisherId.length > 5) {
      this.isAuthenticated = true;
      this.logger.log('Indeed authentication successful');
      return true;
    }
    this.logger.warn('Indeed authentication failed - no publisher ID');
    return false;
  }

  async search(params: SearchParams): Promise<SearchResult> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    const { keywords, location, page = 0, limit = 25 } = params;
    const start = page * limit;

    try {
      const queryParams = new URLSearchParams({
        publisher: this.publisherId,
        q: keywords || '',
        l: location || '',
        start: start.toString(),
        limit: Math.min(limit, 100).toString(),
        format: 'json',
        v: '2',
      });

      const response = await fetch(`${this.baseUrl}?${queryParams}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Indeed API error: ${response.status}`);
      }

      const data = await response.json();
      const jobs = this.transformIndeedJobs(data.results || []);
      
      this.rateLimitRemaining = Math.max(0, this.rateLimitRemaining - 1);

      return {
        jobs,
        total: data.totalResults || jobs.length,
        page: page + 1,
        limit,
        hasMore: start + jobs.length < (data.totalResults || jobs.length),
        creditsUsed: jobs.length,
        rateLimitRemaining: this.rateLimitRemaining,
      };
    } catch (error) {
      this.logger.error('Indeed search error', error);
      return { jobs: [], total: 0, page: 1, limit, hasMore: false };
    }
  }

  async fetchJobById(id: string): Promise<RawJobData | null> {
    // Indeed doesn't have a direct job fetch API, return null
    this.logger.warn('Indeed does not support fetching individual jobs by ID');
    return null;
  }

  private transformIndeedJobs(results: any[]): RawJobData[] {
    return results.map((job: any) => ({
      externalId: job.jobkey,
      title: job.jobtitle,
      description: job.snippet || job.description,
      company: job.company,
      companyName: job.company,
      location: job.formattedLocation || job.city,
      city: job.city,
      state: job.state,
      country: job.country,
      remote: job.remote?.toLowerCase() === 'true' || job.remotejobtype?.toLowerCase().includes('remote'),
      remotePolicy: job.remotejobtype,
      jobType: this.mapJobType(job.jobtype),
      salaryMin: this.parseSalary(job.salarymin),
      salaryMax: this.parseSalary(job.salarymax),
      salaryCurrency: job.salary,
      postedDate: job.date,
      applyUrl: job.url,
      applicationDeadline: job.expiredon,
      source: 'indeed',
      sourceUrl: `https://www.indeed.com/viewjob?jk=${job.jobkey}`,
      tags: job.tags || [],
    }));
  }

  private mapJobType(jobtype: string | undefined): string {
    const typeMap: Record<string, string> = {
      'fulltime': 'Full-time',
      'parttime': 'Part-time',
      'contract': 'Contract',
      'temporary': 'Temporary',
      'internship': 'Internship',
    };
    return typeMap[jobtype?.toLowerCase() || ''] || 'Full-time';
  }

  private parseSalary(salaryStr: string | undefined): number | undefined {
    if (!salaryStr) return undefined;
    const cleaned = salaryStr.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned);
  }

  normalizeJob(job: RawJobData): JobPosting {
    const normalized = super.normalizeJob(job);
    (normalized as any).indeedJobKey = job.externalId;
    (normalized as any).source = 'indeed';
    (normalized as any).sourceUrl = job.sourceUrl;
    return normalized;
  }
}
