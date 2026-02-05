// ============ LEVER ATS SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CandidateData } from '../ats.service';

@Injectable()
export class LeverService {
  private readonly logger = new Logger(LeverService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.lever.co/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('LEVER_API_KEY') || '';
  }

  async createOpportunity(candidate: CandidateData) {
    this.logger.log(`Creating Lever opportunity for ${candidate.email}`);
    return { success: true, data: { id: 'mock-id', stage: 'new' } };
  }

  async getStatus() {
    return { connected: true, provider: 'LEVER' };
  }

  async syncOpportunities() {
    return { synced: 0 };
  }

  async getOpportunities() {
    return { opportunities: [] };
  }

  async handleWebhook(payload: any) {
    return { processed: true };
  }
}
