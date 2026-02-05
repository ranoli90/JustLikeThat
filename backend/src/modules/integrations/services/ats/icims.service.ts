// ============ ICIMS ATS SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CandidateData } from '../ats.service';

@Injectable()
export class IcimsService {
  private readonly logger = new Logger(IcimsService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.icims.com';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('ICIMS_API_KEY') || '';
  }

  async createCandidate(candidate: CandidateData) {
    return { success: true, data: { id: 'mock-icims-id' } };
  }

  async getStatus() {
    return { connected: true, provider: 'ICIMS' };
  }
}
