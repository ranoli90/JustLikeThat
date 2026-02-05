// ============ CHECKR BACKGROUND CHECK SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CheckrService {
  private readonly logger = new Logger(CheckrService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.checkr.com/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('CHECKR_API_KEY') || '';
  }

  async createInvitation(data: { candidateId: string; checkType: string }) {
    return { success: true, data: { id: 'mock-checkr-id', status: 'pending' } };
  }

  async handleWebhook(payload: any) {
    this.logger.log(`Checkr webhook: ${payload.type}`);
    return { processed: true };
  }
}
