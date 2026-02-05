// ============ HRIS SERVICE ============

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BambooHrService } from './hris/bamboohr.service';
import { WorkdayHcmService } from './hris/workday-hcm.service';
import { AdpService } from './hris/adp.service';
import { SapSuccessFactorsService } from './hris/sap-successfactors.service';

export interface EmployeeData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  title?: string;
  manager?: string;
  hireDate?: Date;
  status: 'active' | 'inactive' | 'terminated';
}

@Injectable()
export class HrisService {
  private readonly logger = new Logger(HrisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bambooHrService: BambooHrService,
    private readonly workdayHcmService: WorkdayHcmService,
    private readonly adpService: AdpService,
    private readonly sapSuccessFactorsService: SapSuccessFactorsService,
  ) {}

  /**
   * Sync employees from HRIS
   */
  async syncEmployees(provider: string) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    try {
      switch (normalizedProvider) {
        case 'BAMBOOHR':
          return this.bambooHrService.syncEmployees();
        case 'WORKDAY_HCM':
          return this.workdayHcmService.syncEmployees();
        case 'ADP':
          return this.adpService.syncEmployees();
        case 'SAP_SUCCESSFACTORS':
          return this.sapSuccessFactorsService.syncEmployees();
        default:
          throw new NotFoundException(`Unknown HRIS provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error(`HRIS sync failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get employees from HRIS
   */
  async getEmployees(provider: string, page = 1, limit = 50) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    switch (normalizedProvider) {
      case 'BAMBOOHR':
        return this.bambooHrService.getEmployees(page, limit);
      case 'WORKDAY_HCM':
        return this.workdayHcmService.getEmployees(page, limit);
      default:
        return { employees: [], pagination: { page, limit, total: 0 } };
    }
  }

  /**
   * Get single employee
   */
  async getEmployee(provider: string, employeeId: string) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    switch (normalizedProvider) {
      case 'BAMBOOHR':
        return this.bambooHrService.getEmployee(employeeId);
      default:
        throw new NotFoundException(`Provider not supported: ${provider}`);
    }
  }

  /**
   * Get time-off requests
   */
  async getTimeOff(provider: string, employeeId: string) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    switch (normalizedProvider) {
      case 'BAMBOOHR':
        return this.bambooHrService.getTimeOff(employeeId);
      default:
        return { requests: [] };
    }
  }

  /**
   * Store HRIS credentials
   */
  async storeCredentials(tenantId: string, provider: string, credentials: any) {
    return this.prisma.integrationConfig.upsert({
      where: {
        tenantId_providerName: {
          tenantId,
          providerName: provider.toUpperCase().replace('-', '_'),
        },
      },
      update: {
        credentials,
        status: 'ACTIVE',
      },
      create: {
        tenantId,
        providerName: provider.toUpperCase().replace('-', '_'),
        integrationType: 'HRIS',
        credentials,
        status: 'ACTIVE',
      },
    });
  }
}
