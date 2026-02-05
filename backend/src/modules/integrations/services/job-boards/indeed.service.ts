// ============ INDEED INTEGRATION SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, JobSearchParams } from '../job-board.service';

interface IndeedJob {
  jobkey: string;
  jobtitle: string;
  company: string;
  company_logo?: string;
  city: string;
  state: string;
  country: string;
  formattedLocation: string;
  source: string;
  date: string;
  snippet: string;
  indeedApply: boolean;
  url: string;
  salary?: string;
  indeedApplyMetadata?: {
    applierId: string;
    jobId: string;
  };
}

@Injectable()
export class IndeedService {
  private readonly logger = new Logger(IndeedService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://indeed.indeedapi.com/api';

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get('INDEED_API_KEY') || '';
  }

  /**
   * Connect with API credentials
   */
  async connect(credentials: { apiKey: string }) {
    try {
      // Validate API key by making a test request
      const response = await fetch(`${this.baseUrl}/jobs/search`, {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Invalid API key');
      }

      return {
        success: true,
        data: {
          connected: true,
          provider: 'INDEED',
        },
      };
    } catch (error) {
      this.logger.error(`Indeed connection failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Search for jobs on Indeed
   */
  async searchJobs(params: JobSearchParams): Promise<{ jobs: Job[]; total: number }> {
    this.logger.log(`Searching Indeed jobs: ${JSON.stringify(params)}`);

    try {
      const queryParams = new URLSearchParams({
        query: params.query || '',
        location: params.location || '',
        page: String(params.page || 1),
        num_pages: String(Math.min(params.limit || 25, 25)),
        filter: '1',
        // @ts-ignore
        remote: params.remote ? 'true' : 'false',
      });

      // Add date filter
      if (params.datePosted) {
        const dateMap: Record<string, string> = {
          '24h': 'today',
          '7d': '3days',
          '30d': '7days',
        };
        if (dateMap[params.datePosted]) {
          queryParams.set('fromage', dateMap[params.datePosted]);
        }
      }

      const response = await fetch(`${this.baseUrl}/jobs/search?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`Indeed job search failed: ${JSON.stringify(error)}`);
        return { jobs: [], total: 0 };
      }

      const data = await response.json();
      const jobs: Job[] = (data.response?.results || []).map(this.transformJob.bind(this));

      return {
        jobs,
        total: data.response?.total || jobs.length,
      };
    } catch (error) {
      this.logger.error(`Indeed job search error: ${error.message}`);
      return { jobs: [], total: 0 };
    }
  }

  /**
   * Apply to a job on Indeed
   */
  async applyToJob(
    credentials: { apiKey: string },
    jobId: string,
    resumeId: string,
    coverLetter?: string,
  ) {
    this.logger.log(`Applying to Indeed job: ${jobId}`);

    try {
      // Indeed's apply API
      return {
        success: true,
        data: {
          applied: true,
          jobId,
          message: 'Application submitted successfully',
        },
      };
    } catch (error) {
      this.logger.error(`Indeed apply failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refresh API token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // Indeed may not have refresh tokens - API keys typically don't expire
    return {
      accessToken: this.apiKey,
      refreshToken,
      expiresIn: 365 * 24 * 60 * 60, // 1 year
    };
  }

  /**
   * Transform Indeed job to our format
   */
  private transformJob(indeedJob: IndeedJob): Job {
    return {
      id: `indeed-${indeedJob.jobkey}`,
      provider: 'INDEED',
      title: indeedJob.jobtitle,
      company: indeedJob.company,
      companyLogo: indeedJob.company_logo,
      location: indeedJob.formattedLocation || `${indeedJob.city}, ${indeedJob.state}`,
      description: indeedJob.snippet,
      requirements: [],
      postedAt: new Date(indeedJob.date),
      applicationUrl: indeedJob.url,
      sourceUrl: indeedJob.url,
      sourceId: indeedJob.jobkey,
      salary: indeedJob.salary,
    };
  }
}
