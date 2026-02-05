// ============ REMOTE.CO INTEGRATION SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, JobSearchParams } from '../job-board.service';

@Injectable()
export class RemoteCoService {
  private readonly logger = new Logger(RemoteCoService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.remote.co/graphql';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('REMOTECO_API_KEY') || '';
  }

  async connect(credentials: { apiKey: string }) {
    return { success: true, data: { connected: true, provider: 'REMOTE_CO' } };
  }

  async searchJobs(params: JobSearchParams): Promise<{ jobs: Job[]; total: number }> {
    this.logger.log(`Searching Remote.co jobs: ${JSON.stringify(params)}`);
    return { jobs: [], total: 0 };
  }

  async refreshToken(refreshToken: string) {
    return { accessToken: this.apiKey, refreshToken, expiresIn: 365 * 24 * 60 * 60 };
  }
}
