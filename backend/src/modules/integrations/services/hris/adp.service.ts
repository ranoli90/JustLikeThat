// ============ ADP SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdpService {
  private readonly logger = new Logger(AdpService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl = 'https://api.adp.com';

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get('ADP_CLIENT_ID') || '';
    this.clientSecret = this.configService.get('ADP_CLIENT_SECRET') || '';
  }

  async syncEmployees() {
    return { synced: 0 };
  }
}
