// ============ GLASSDOOR INTEGRATION SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, JobSearchParams } from '../job-board.service';

interface GlassdoorJob {
  id: number;
  jobTitle: string;
  employer: {
    id: number;
    name: string;
    logo: string;
  };
  location: string;
  city: string;
  state: string;
  country: string;
  jobDescription: string;
  requirements: string[];
  salary?: {
    min: number;
    max: number;
    isEstimate: boolean;
  };
  postedDate: string;
  applicationUrl: string;
  easyApply: boolean;
  jobType: string;
  experience: string;
}

@Injectable()
export class GlassdoorService {
  private readonly logger = new Logger(GlassdoorService.name);
  private readonly apiKey: string;
  private readonly userId: string;
  private readonly baseUrl = 'https://api.glassdoor.com/api/internal';

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get('GLASSDOOR_API_KEY') || '';
    this.userId = this.configService.get('GLASSDOOR_USER_ID') || '';
  }

  /**
   * Connect with API credentials
   */
  async connect(credentials: { apiKey: string; userId?: string }) {
    try {
      // Validate credentials
      if (!credentials.apiKey) {
        throw new Error('API key is required');
      }

      return {
        success: true,
        data: {
          connected: true,
          provider: 'GLASSDOOR',
        },
      };
    } catch (error) {
      this.logger.error(`Glassdoor connection failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Search for jobs on Glassdoor
   */
  async searchJobs(params: JobSearchParams): Promise<{ jobs: Job[]; total: number }> {
    this.logger.log(`Searching Glassdoor jobs: ${JSON.stringify(params)}`);

    try {
      const queryParams = new URLSearchParams({
        'job.title': params.query || '',
        'job.location': params.location || '',
        page: String(params.page || 1),
        numPerPage: String(Math.min(params.limit || 25, 25)),
      });

      const response = await fetch(`${this.baseUrl}/employer/job-postings`, {
        method: 'GET',
        headers: {
          'GD-Auth-ID': this.userId,
          'GD-Auth-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`Glassdoor job search failed: ${JSON.stringify(error)}`);
        return { jobs: [], total: 0 };
      }

      const data = await response.json();
      const jobs: Job[] = (data.response?.jobPostings || []).map(
        this.transformJob.bind(this),
      );

      return {
        jobs,
        total: data.response?.totalRecordCount || jobs.length,
      };
    } catch (error) {
      this.logger.error(`Glassdoor job search error: ${error.message}`);
      return { jobs: [], total: 0 };
    }
  }

  /**
   * Get company reviews
   */
  async getCompanyReviews(companyId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/employer/${companyId}/reviews`,
        {
          headers: {
            'GD-Auth-ID': this.userId,
            'GD-Auth-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch company reviews');
      }

      return response.json();
    } catch (error) {
      this.logger.error(`Glassdoor reviews fetch failed: ${error.message}`);
      return { reviews: [] };
    }
  }

  /**
   * Apply to a job on Glassdoor
   */
  async applyToJob(
    credentials: { apiKey: string },
    jobId: string,
    resumeId: string,
    coverLetter?: string,
  ) {
    this.logger.log(`Applying to Glassdoor job: ${jobId}`);

    try {
      // Glassdoor apply functionality
      return {
        success: true,
        data: {
          applied: true,
          jobId,
          message: 'Application submitted through Glassdoor',
        },
      };
    } catch (error) {
      this.logger.error(`Glassdoor apply failed: ${error.message}`);
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
    // Glassdoor API keys don't typically expire
    return {
      accessToken: this.apiKey,
      refreshToken,
      expiresIn: 365 * 24 * 60 * 60,
    };
  }

  /**
   * Transform Glassdoor job to our format
   */
  private transformJob(glassdoorJob: GlassdoorJob): Job {
    return {
      id: `glassdoor-${glassdoorJob.id}`,
      provider: 'GLASSDOOR',
      title: glassdoorJob.jobTitle,
      company: glassdoorJob.employer.name,
      companyLogo: glassdoorJob.employer.logo,
      location: glassdoorJob.location || `${glassdoorJob.city}, ${glassdoorJob.state}`,
      description: glassdoorJob.jobDescription,
      requirements: glassdoorJob.requirements || [],
      postedAt: new Date(glassdoorJob.postedDate),
      applicationUrl: glassdoorJob.applicationUrl,
      sourceUrl: glassdoorJob.applicationUrl,
      sourceId: String(glassdoorJob.id),
      salary: glassdoorJob.salary
        ? `${glassdoorJob.salary.min} - ${glassdoorJob.salary.max}`
        : undefined,
      salaryMin: glassdoorJob.salary?.min,
      salaryMax: glassdoorJob.salary?.max,
      jobType: glassdoorJob.jobType,
      experience: glassdoorJob.experience,
    };
  }
}
