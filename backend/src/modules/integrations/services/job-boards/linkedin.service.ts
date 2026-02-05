// ============ LINKEDIN INTEGRATION SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../common/encryption.service';
import { Job, JobSearchParams } from './job-board.service';

interface LinkedInJob {
  jobId: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  isRemote?: boolean;
  jobType?: string;
  experience?: string;
  description?: string;
  criteria?: Record<string, any>;
  applyUrl: string;
  listedAt: number; // Unix timestamp
}

@Injectable()
export class LinkedInService {
  private readonly logger = new Logger(LinkedInService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly baseUrl = 'https://api.linkedin.com/v2';
  private readonly authUrl = 'https://www.linkedin.com/oauth/v2';

  constructor(
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
  ) {
    this.clientId = this.configService.get('LINKEDIN_CLIENT_ID') || '';
    this.clientSecret = this.configService.get('LINKEDIN_CLIENT_SECRET') || '';
    this.redirectUri = this.configService.get('LINKEDIN_REDIRECT_URI') || '';
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const scopes = [
      'r_liteprofile',
      'r_emailaddress',
      'w_member_social',
      'r_jobs',
      'rw_ads',
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      scope: scopes,
    });

    return `${this.authUrl}/authorization?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    scope: string;
  }> {
    const response = await fetch(`${this.authUrl}/accessToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LinkedIn token exchange failed: ${error.error_description}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(`${this.authUrl}/accessToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LinkedIn token refresh failed: ${error.error_description}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Connect with OAuth credentials
   */
  async connect(credentials: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }) {
    try {
      // Validate token by fetching user profile
      const profile = await this.getUserProfile(credentials.accessToken);

      return {
        success: true,
        data: {
          connected: true,
          profile: {
            id: profile.id,
            firstName: profile.firstName?.localized?.en_US,
            lastName: profile.lastName?.localized?.en_US,
            email: profile.email?.elements?.[0]?.handle?.['email-address'] ?? null,
          },
        },
      };
    } catch (error) {
      this.logger.error(`LinkedIn connection failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Search for jobs using LinkedIn Jobs API v2
   */
  async searchJobs(params: JobSearchParams): Promise<{ jobs: Job[]; total: number }> {
    this.logger.log(`Searching LinkedIn jobs: ${JSON.stringify(params)}`);

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      this.logger.warn('No LinkedIn access token available');
      return { jobs: [], total: 0 };
    }

    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        q: 'search',
        search: JSON.stringify({
          keywords: params.query,
          location: params.location,
          remote: params.remote,
        }),
        count: String(params.limit || 25),
        start: String(((params.page || 1) - 1) * (params.limit || 25)),
      });

      const response = await fetch(`${this.baseUrl}/jobsSearch?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`LinkedIn job search failed: ${JSON.stringify(error)}`);
        return { jobs: [], total: 0 };
      }

      const data = await response.json();
      const jobs: Job[] = (data.elements || []).map(this.transformJob.bind(this));

      return {
        jobs,
        total: data.paging?.total || jobs.length,
      };
    } catch (error) {
      this.logger.error(`LinkedIn job search error: ${error.message}`);
      return { jobs: [], total: 0 };
    }
  }

  /**
   * Apply to a job
   */
  async applyToJob(
    credentials: { accessToken: string },
    jobId: string,
    resumeId: string,
    coverLetter?: string,
  ) {
    this.logger.log(`Applying to LinkedIn job: ${jobId}`);

    try {
      // LinkedIn's Apply API is limited - typically just redirecting to apply URL
      // For now, we'll return the application URL
      return {
        success: true,
        data: {
          applied: false,
          message: 'Please apply through the LinkedIn job application URL',
          applicationUrl: `https://www.linkedin.com/jobs/view/${jobId}`,
        },
      };
    } catch (error) {
      this.logger.error(`LinkedIn apply failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(accessToken: string) {
    const response = await fetch(`${this.baseUrl}/me?projection=(id,firstName,lastName)`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch LinkedIn profile');
    }

    return response.json();
  }

  /**
   * Transform LinkedIn job to our format
   */
  private transformJob(linkedInJob: LinkedInJob): Job {
    return {
      id: `linkedin-${linkedInJob.jobId}`,
      provider: 'LINKEDIN',
      title: linkedInJob.title,
      company: linkedInJob.companyName,
      companyLogo: linkedInJob.companyLogo,
      location: linkedInJob.location,
      remote: linkedInJob.isRemote,
      jobType: linkedInJob.jobType,
      experience: linkedInJob.experience,
      description: linkedInJob.description || '',
      requirements: [],
      postedAt: new Date(linkedInJob.listedAt * 1000),
      applicationUrl: linkedInJob.applyUrl,
      sourceUrl: `https://www.linkedin.com/jobs/view/${linkedInJob.jobId}`,
      sourceId: linkedInJob.jobId,
    };
  }

  /**
   * Get access token (would retrieve from storage in real implementation)
   */
  private async getAccessToken(): Promise<string | null> {
    // This would retrieve the stored access token
    // For now, return null indicating no token available
    return null;
  }
}
