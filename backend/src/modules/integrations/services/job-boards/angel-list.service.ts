// ============ ANGEL LIST INTEGRATION SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, JobSearchParams } from '../job-board.service';

@Injectable()
export class AngelListService {
  private readonly logger = new Logger(AngelListService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl = 'https://api.angel.co/v1';

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get('ANGELLIST_CLIENT_ID') || '';
    this.clientSecret = this.configService.get('ANGELLIST_CLIENT_SECRET') || '';
  }

  async connect(credentials: { accessToken?: string }) {
    return { success: true, data: { connected: true, provider: 'ANGEL_LIST' } };
  }

  async searchJobs(params: JobSearchParams): Promise<{ jobs: Job[]; total: number }> {
    this.logger.log(`Searching AngelList jobs: ${JSON.stringify(params)}`);
    return { jobs: [], total: 0 };
  }

  async refreshToken(refreshToken: string) {
    return { accessToken: '', refreshToken, expiresIn: 365 * 24 * 60 * 60 };
  }
}
