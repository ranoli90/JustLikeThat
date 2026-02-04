import { Injectable, Logger } from '@nestjs/common';
import { BaseJobSource, JobSourceConfig, SearchParams, SearchResult, RawJobData } from './base-job-source.interface';
import { JobSourceCategory, ComplianceLevel, SourceReliability, CostEffectiveness } from '../../../entities/job-source.entity';
import { JobPosting, RemotePreference, JobType } from '../../../entities/job-posting.entity';

@Injectable()
export class LinkedInIntegration extends BaseJobSource {
  readonly sourceName = 'LinkedIn';
  readonly sourceId = 'linkedin';
  readonly category = JobSourceCategory.API_INTEGRATION;
  readonly complianceLevel = ComplianceLevel.HIGH;
  readonly reliability = SourceReliability.CRITICAL;
  readonly costEffectiveness = CostEffectiveness.HIGH;
  readonly requiresAuth = true;
  readonly isFree = false;

  private readonly logger = new Logger(LinkedInIntegration.name);
  private readonly baseUrl = 'https://api.linkedin.com/v2';
  private clientId: string = '';
  private clientSecret: string = '';
  private refreshToken: string = '';

  configure(config: JobSourceConfig): void {
    super.configure(config);
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret || '';
    this.accessToken = config.accessToken || '';
    this.refreshToken = config.refreshToken || '';
  }

  async authenticate(): Promise<boolean> {
    try {
      // LinkedIn uses OAuth 2.0 with JWT tokens
      // In production, implement proper OAuth flow
      if (this.accessToken && this.accessToken.length > 10) {
        this.isAuthenticated = true;
        this.logger.log('LinkedIn authentication successful');
        return true;
      }
      
      // If we have refresh token, try to get new access token
      if (this.refreshToken) {
        const tokenResponse = await this.refreshAccessToken();
        if (tokenResponse) {
          this.accessToken = tokenResponse.access_token;
          this.isAuthenticated = true;
          return true;
        }
      }

      this.logger.warn('LinkedIn authentication failed - no valid credentials');
      return false;
    } catch (error) {
      this.logger.error('LinkedIn authentication error', error);
      return false;
    }
  }

  private async refreshAccessToken(): Promise<{ access_token: string; expires_in: number } | null> {
    try {
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Failed to refresh LinkedIn token', error);
      return null;
    }
  }

  async search(params: SearchParams): Promise<SearchResult> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    const { keywords, location, remote, page = 1, limit = 25 } = params;
    const start = (page - 1) * limit;

    try {
      // LinkedIn Jobs API endpoint
      const queryParams = new URLSearchParams({
        q: 'search',
        keywords: keywords || '',
        location: location || '',
        start: start.toString(),
        count: Math.min(limit, 100).toString(),
      });

      if (remote) {
        queryParams.append('f_WT', '2'); // Remote jobs filter
      }

      const response = await fetch(`${this.baseUrl}/jobsSearch?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`LinkedIn API error: ${response.status} - ${errorText}`);
        throw new Error(`LinkedIn API error: ${response.status}`);
      }

      const data = await response.json();
      const jobs = this.transformLinkedInJobs(data.elements || []);
      
      // Update rate limit info from headers
      this.updateRateLimitInfo(response);

      return {
        jobs,
        total: data.total || jobs.length,
        page,
        limit,
        hasMore: start + jobs.length < (data.total || jobs.length),
        creditsUsed: 1,
        rateLimitRemaining: this.rateLimitRemaining,
      };
    } catch (error) {
      this.logger.error('LinkedIn search error', error);
      return { jobs: [], total: 0, page: 1, limit, hasMore: false };
    }
  }

  async fetchJobById(id: string): Promise<RawJobData | null> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    try {
      const response = await fetch(`${this.baseUrl}/jobs/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.error(`Failed to fetch LinkedIn job ${id}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return this.transformLinkedInJob(data);
    } catch (error) {
      this.logger.error(`Error fetching LinkedIn job ${id}`, error);
      return null;
    }
  }

  private transformLinkedInJobs(elements: any[]): RawJobData[] {
    return elements.map((job: any) => this.transformLinkedInJob(job));
  }

  private transformLinkedInJob(job: any): RawJobData {
    return {
      externalId: job.id?.toString(),
      title: job.title || job.jobTitle,
      description: job.description || job.descriptionSnippet,
      company: job.companyName || job.company?.name,
      companyName: job.companyName || job.company?.name,
      location: job.formattedLocation || job.location,
      city: job.city,
      state: job.region,
      country: job.country,
      remote: job.workType === 'remote' || job.remote === true,
      remotePolicy: job.workType === '2' ? 'remote' : 'onsite',
      jobType: this.mapEmploymentType(job.employmentType),
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      postedDate: job.postedAt || job.date,
      applyUrl: job.applyUrl || `https://www.linkedin.com/jobs/view/${job.id}`,
      source: 'linkedin',
      sourceUrl: `https://www.linkedin.com/jobs/view/${job.id}`,
      tags: job.tags || [],
    };
  }

  private mapEmploymentType(linkedInType: string | undefined): string {
    const typeMap: Record<string, string> = {
      'FULL_TIME': 'Full-time',
      'PART_TIME': 'Part-time',
      'CONTRACT': 'Contract',
      'TEMPORARY': 'Temporary',
      'INTERNSHIP': 'Internship',
    };
    return typeMap[linkedInType || ''] || 'Full-time';
  }

  private updateRateLimitInfo(response: Response): void {
    // LinkedIn uses different rate limit headers
    const remaining = response.headers.get('x-linkedin-rate-limit-remaining');
    const resetTime = response.headers.get('x-linkedin-rate-limit-reset');
    
    if (remaining) {
      this.rateLimitRemaining = parseInt(remaining, 10);
    }
    if (resetTime) {
      this.rateLimitReset = parseInt(resetTime, 10) * 1000;
    }
  }

  normalizeJob(job: RawJobData): JobPosting {
    const normalized = super.normalizeJob(job);
    
    // Add LinkedIn-specific fields
    (normalized as any).linkedinJobId = job.externalId;
    (normalized as any).source = 'linkedin';
    (normalized as any).sourceUrl = job.sourceUrl;
    (normalized as any).logoUrl = job.companyLogo;
    
    return normalized;
  }
}
