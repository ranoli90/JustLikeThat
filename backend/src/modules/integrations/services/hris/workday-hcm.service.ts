// ============ WORKDAY HCM SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WorkdayHcmService {
  private readonly logger = new Logger(WorkdayHcmService.name);
  private readonly tenantId: string;
  private readonly baseUrl = 'https://api.workday.com';

  constructor(private readonly configService: ConfigService) {
    this.tenantId = this.configService.get('WORKDAY_HCM_TENANT_ID') || '';
  }

  async syncEmployees() {
    return { synced: 0 };
  }

  async getEmployees(page = 1, limit = 50) {
    return { employees: [], pagination: { page, limit, total: 0 } };
  }
}
