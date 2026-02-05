// ============ GREENHOUSE ATS SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CandidateData } from '../ats.service';

@Injectable()
export class GreenhouseService {
  private readonly logger = new Logger(GreenhouseService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://harvest.greenhouse.io/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('GREENHOUSE_API_KEY') || '';
  }

  async createApplication(candidate: CandidateData) {
    this.logger.log(`Creating Greenhouse application for ${candidate.email}`);
    try {
      const response = await fetch(`${this.baseUrl}/candidates`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: candidate.firstName,
          last_name: candidate.lastName,
          email_addresses: [{ value: candidate.email }],
          phone_numbers: candidate.phone ? [{ value: candidate.phone }] : [],
          website_addresses: candidate.resumeUrl ? [{ value: candidate.resumeUrl }] : [],
          notes: candidate.notes,
        }),
      });

      if (!response.ok) {
        throw new Error(`Greenhouse API error: ${response.statusText}`);
      }

      return { success: true, data: await response.json() };
    } catch (error) {
      this.logger.error(`Greenhouse application failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getStatus() {
    return { connected: true, provider: 'GREENHOUSE', jobs: [], candidates: 0 };
  }

  async syncCandidates() {
    return { synced: 0, errors: [] };
  }

  async getJobs() {
    return { jobs: [] };
  }

  async handleWebhook(payload: any) {
    this.logger.log(`Greenhouse webhook: ${payload.action}`);
    return { processed: true };
  }
}
