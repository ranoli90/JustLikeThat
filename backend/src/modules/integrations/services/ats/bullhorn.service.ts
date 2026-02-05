// ============ BULLHORN ATS SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CandidateData } from '../ats.service';

@Injectable()
export class BullhornService {
  private readonly logger = new Logger(BullhornService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get('BULLHORN_CLIENT_ID') || '';
    this.clientSecret = this.configService.get('BULLHORN_CLIENT_SECRET') || '';
  }

  async createCandidate(candidate: CandidateData) {
    return { success: true, data: { id: 'mock-bullhorn-id' } };
  }

  async getStatus() {
    return { connected: true, provider: 'BULLHORN' };
  }
}
