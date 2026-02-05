// ============ SMART RECRUITERS ATS SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CandidateData } from '../ats.service';

@Injectable()
export class SmartRecruitersService {
  private readonly logger = new Logger(SmartRecruitersService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.smartrecruiters.com';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('SMARTRECRUITERS_API_KEY') || '';
  }

  async createCandidate(candidate: CandidateData) {
    return { success: true, data: { id: 'mock-smart-id' } };
  }

  async getStatus() {
    return { connected: true, provider: 'SMART_RECRUITERS' };
  }
}
