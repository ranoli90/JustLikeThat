// ============ BAMBOO HR SERVICE ============

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmployeeData } from '../hris.service';

@Injectable()
export class BambooHrService {
  private readonly logger = new Logger(BambooHrService.name);
  private readonly apiKey: string;
  private readonly companyDomain: string;
  private readonly baseUrl = 'https://api.bamboohr.com/api/gateway.php';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('BAMBOOHR_API_KEY') || '';
    this.companyDomain = this.configService.get('BAMBOOHR_COMPANY_DOMAIN') || '';
  }

  async syncEmployees() {
    return { synced: 0, employees: [] };
  }

  async getEmployees(page = 1, limit = 50) {
    return { employees: [], pagination: { page, limit, total: 0 } };
  }

  async getEmployee(employeeId: string) {
    return null;
  }

  async getTimeOff(employeeId: string) {
    return { requests: [] };
  }
}
