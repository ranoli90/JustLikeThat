// ============ ENTERPRISE INTEGRATIONS CONTROLLER ============

import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { ERPIntegrationService } from '../services/enterprise-integrations/erp-integration.service';
import { CRMIntegrationService } from '../services/enterprise-integrations/crm-integration.service';
import { CorporateLMSService } from '../services/enterprise-integrations/corporate-lms.service';
import { TalentManagementService } from '../services/enterprise-integrations/talent-management.service';
import { EnterpriseAPIGatewayService } from '../services/enterprise-integrations/enterprise-api-gateway.service';
import { LegacyIntegrationFramework } from '../services/enterprise-integrations/legacy-integration.framework';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/enterprise-integrations')
export class EnterpriseIntegrationsController {
  constructor(
    private readonly erpService: ERPIntegrationService,
    private readonly crmService: CRMIntegrationService,
    private readonly lmsService: CorporateLMSService,
    private readonly talentService: TalentManagementService,
    private readonly apiGatewayService: EnterpriseAPIGatewayService,
    private readonly legacyService: LegacyIntegrationFramework,
    private readonly prisma: PrismaService,
  ) {}

  // ============ ERP ENDPOINTS ============

  @Post('erp/connect')
  async connectERP(
    @Headers('x-tenant-id') tenantId: string,
    @Body() config: { provider: string; baseUrl: string; credentials: any; syncSettings: any },
  ) {
    const erpConfig = {
      provider: config.provider as 'sap' | 'oracle' | 'dynamics',
      baseUrl: config.baseUrl,
      authType: 'oauth2',
      credentials: config.credentials,
      syncSettings: config.syncSettings,
    };

    switch (config.provider) {
      case 'sap':
        return this.erpService.connectToSAP(tenantId, erpConfig);
      case 'oracle':
        return this.erpService.connectToOracle(tenantId, erpConfig);
      case 'dynamics':
        return this.erpService.connectToDynamics(tenantId, erpConfig);
      default:
        throw new HttpException('Unsupported ERP provider', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('erp/:id/status')
  async getERPStatus(@Param('id') connectionId: string) {
    return this.erpService.getConnectionStatus(connectionId);
  }

  @Post('erp/:id/sync')
  async syncERP(
    @Param('id') connectionId: string,
    @Query('type') syncType: 'financial' | 'org_structure' = 'financial',
  ) {
    const connection = await this.erpService.getConnectionStatus(connectionId);
    if (!connection) {
      throw new HttpException('Connection not found', HttpStatus.NOT_FOUND);
    }

    switch (connection.provider) {
      case 'sap':
        if (syncType === 'financial') {
          return this.erpService.syncSAPFinancialData(connectionId);
        }
        return this.erpService.syncSAPOrgStructure(connectionId);
      case 'oracle':
        if (syncType === 'financial') {
          return this.erpService.syncOracleFinancialData(connectionId);
        }
        return this.erpService.syncOracleOrgStructure(connectionId);
      case 'dynamics':
        if (syncType === 'financial') {
          return this.erpService.syncDynamicsFinancialData(connectionId);
        }
        return this.erpService.syncDynamicsOrgStructure(connectionId);
      default:
        throw new HttpException('Unsupported ERP provider', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('erp/:id/financial-data')
  async getFinancialData(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') connectionId: string,
  ) {
    return this.erpService.getFinancialData(tenantId);
  }

  // ============ CRM ENDPOINTS ============

  @Post('crm/connect')
  async connectCRM(
    @Headers('x-tenant-id') tenantId: string,
    @Body() config: { provider: string; baseUrl: string; credentials: any; syncSettings: any },
  ) {
    const crmConfig = {
      provider: config.provider as 'salesforce' | 'hubspot' | 'zoho',
      baseUrl: config.baseUrl,
      authType: 'oauth2' as const,
      credentials: config.credentials,
      syncSettings: config.syncSettings,
    };

    switch (config.provider) {
      case 'salesforce':
        return this.crmService.connectToSalesforce(tenantId, crmConfig);
      case 'hubspot':
        return this.crmService.connectToHubSpot(tenantId, crmConfig);
      case 'zoho':
        return this.crmService.connectToZoho(tenantId, crmConfig);
      default:
        throw new HttpException('Unsupported CRM provider', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('crm/:id/status')
  async getCRMStatus(@Param('id') connectionId: string) {
    return this.crmService.getConnectionStatus(connectionId);
  }

  @Post('crm/:id/sync')
  async syncCRM(
    @Param('id') connectionId: string,
    @Query('type') syncType: 'contacts' | 'pipeline' = 'contacts',
  ) {
    const connection = await this.crmService.getConnectionStatus(connectionId);
    if (!connection) {
      throw new HttpException('Connection not found', HttpStatus.NOT_FOUND);
    }

    switch (connection.provider) {
      case 'salesforce':
        if (syncType === 'contacts') {
          return this.crmService.syncSalesforceContacts(connectionId);
        }
        return this.crmService.syncSalesforcePipeline(connectionId);
      case 'hubspot':
        if (syncType === 'contacts') {
          return this.crmService.syncHubSpotContacts(connectionId);
        }
        return this.crmService.syncHubSpotLists(connectionId);
      case 'zoho':
        return this.crmService.syncZohoContacts(connectionId);
      default:
        throw new HttpException('Unsupported CRM provider', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('crm/:id/contacts')
  async getContacts(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') connectionId: string,
  ) {
    return this.crmService.getContacts(tenantId);
  }

  // ============ LMS ENDPOINTS ============

  @Post('lms/connect')
  async connectLMS(
    @Headers('x-tenant-id') tenantId: string,
    @Body() config: { provider: string; baseUrl: string; credentials: any; syncSettings: any },
  ) {
    const lmsConfig = {
      provider: config.provider as 'workday' | 'cornerstone' | 'sap_sf',
      baseUrl: config.baseUrl,
      authType: 'oauth2' as const,
      credentials: config.credentials,
      syncSettings: config.syncSettings,
    };

    switch (config.provider) {
      case 'workday':
        return this.lmsService.connectToWorkdayLearning(tenantId, lmsConfig);
      case 'cornerstone':
        return this.lmsService.connectToCornerstone(tenantId, lmsConfig);
      case 'sap_sf':
        return this.lmsService.connectToSAPSF(tenantId, lmsConfig);
      default:
        throw new HttpException('Unsupported LMS provider', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('lms/:id/courses')
  async getCourses(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') connectionId: string,
  ) {
    return this.lmsService.getCourses(tenantId);
  }

  @Post('lms/:id/enroll')
  async enrollInCourse(
    @Param('id') connectionId: string,
    @Body() body: { userId: string; courseId: string },
  ) {
    return this.lmsService.enrollUserInCourse(connectionId, body.userId, body.courseId);
  }

  @Get('lms/:id/completions')
  async getCompletions(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') connectionId: string,
  ) {
    return this.lmsService.getCompletions(tenantId);
  }

  // ============ TALENT MANAGEMENT ENDPOINTS ============

  @Post('talent/sync')
  async syncTalent(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { syncType: 'succession' | 'performance' | 'compensation' | 'lifecycle' | 'pools' },
  ) {
    switch (body.syncType) {
      case 'succession':
        return this.talentService.syncSuccessionPlans(tenantId);
      case 'performance':
        return this.talentService.syncPerformanceReviews(tenantId);
      case 'compensation':
        return this.talentService.syncCompensationData(tenantId);
      case 'lifecycle':
        return this.talentService.syncEmployeeLifecycle(tenantId);
      case 'pools':
        return this.talentService.syncTalentPools(tenantId);
      default:
        throw new HttpException('Unsupported sync type', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('talent/:id/status')
  async getTalentStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') syncType: string,
  ) {
    return this.talentService.getSyncStatus(tenantId, syncType);
  }

  // ============ ENTERPRISE API GATEWAY ENDPOINTS ============

  @Post('gateway/configure')
  async configureGateway(
    @Headers('x-tenant-id') tenantId: string,
    @Body() config: any,
  ) {
    const results: any = {};

    if (config.rateLimit) {
      results.rateLimit = await this.apiGatewayService.configureRateLimit(tenantId, config.rateLimit);
    }
    if (config.authProvider) {
      results.authProvider = await this.apiGatewayService.configureAuthProvider(tenantId, config.authProvider);
    }

    return results;
  }

  @Get('gateway/:id/rate-limit')
  async getRateLimit(@Headers('x-tenant-id') tenantId: string) {
    return this.apiGatewayService.getRateLimitStatus(tenantId);
  }

  // ============ LEGACY SYSTEM ENDPOINTS ============

  @Post('legacy/connect')
  async connectLegacy(
    @Headers('x-tenant-id') tenantId: string,
    @Body() config: any,
  ) {
    return this.legacyService.connectToLegacySystem(tenantId, config);
  }

  @Get('legacy/:id/status')
  async getLegacyStatus(@Param('id') connectionId: string) {
    return this.legacyService.getLegacyConnectionStatus(connectionId);
  }

  @Post('legacy/:id/sync')
  async syncLegacy(
    @Param('id') connectionId: string,
    @Body() body: any,
  ) {
    return this.legacyService.startMigration(connectionId, connectionId, 'full');
  }

  // ============ SYNC MANAGEMENT ENDPOINTS ============

  @Get('sync/logs')
  async getSyncLogs(
    @Query('connectionType') connectionType?: string,
  ) {
    return this.prisma.dataSyncLog.findMany({
      where: connectionType ? { connectionType: connectionType as any } : undefined,
      orderBy: { startedAt: 'desc' },
      take: 100,
    });
  }
}
