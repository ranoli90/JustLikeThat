// ============ SAP SUCCESSFACTORS SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SapSuccessFactorsService {
  private readonly logger = new Logger(SapSuccessFactorsService.name);
  private readonly companyId: string;
  private readonly baseUrl = 'https://api.successfactors.com';

  constructor(private readonly configService: ConfigService) {
    this.companyId = this.configService.get('SAPSF_COMPANY_ID') || '';
  }

  async syncEmployees() {
    return { synced: 0 };
  }
}
