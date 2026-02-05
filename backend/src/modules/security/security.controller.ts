import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SecurityService } from './services/security.service';
import { ThreatDetectionService } from './services/threat-detection.service';
import { EncryptionService } from './services/encryption.service';
import { AuditService } from './services/audit.service';
import { MfaService } from './services/mfa.service';
import { ComplianceService } from './services/compliance.service';
import { DataRetentionService } from './services/data-retention.service';
import { ConsentService } from './services/consent.service';
import { IncidentResponseService } from './services/incident-response.service';
import { ApiSecurityService } from './services/api-security.service';
import { VulnerabilityScannerService } from './services/vulnerability-scanner.service';
import { GDPRService } from './services/gdpr.service';
import { HIPAAService } from './services/hipaa.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('api/v1/security')
@UseGuards(JwtAuthGuard)
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly threatDetectionService: ThreatDetectionService,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: AuditService,
    private readonly mfaService: MfaService,
    private readonly complianceService: ComplianceService,
    private readonly dataRetentionService: DataRetentionService,
    private readonly consentService: ConsentService,
    private readonly incidentResponseService: IncidentResponseService,
    private readonly apiSecurityService: ApiSecurityService,
    private readonly vulnerabilityScannerService: VulnerabilityScannerService,
    private readonly gdprService: GDPRService,
    private readonly hipaaService: HIPAAService,
  ) {}

  // ============ Dashboard ============
  @Get('dashboard')
  getSecurityDashboard(@Req() req: any) {
    return this.securityService.getSecurityDashboard();
  }

  // ============ Security Audit Logs ============
  @Get('audit-logs')
  getAuditLogs(
    @Req() req: any,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.getAuditLogs({
      tenantId: req.user?.tenantId || req.user?.tenantId || 'default',
      userId,
      action,
      resource,
      riskLevel,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Post('audit-logs/search')
  searchAuditLogs(
    @Req() req: any,
    @Body() body: { query?: string; filters?: any; dateRange?: { start: string; end: string } },
  ) {
    return this.auditService.searchAuditLogs(req.user?.tenantId || 'default', body);
  }

  @Get('audit-logs/export')
  exportAuditLogs(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.auditService.exportAuditLogs(
      req.user?.tenantId || 'default',
      startDate,
      endDate,
    );
  }

  @Get('audit-logs/high-risk')
  getHighRiskLogs(@Req() req: any, @Query('limit') limit?: string) {
    return this.auditService.getHighRiskLogs(
      req.user?.tenantId || 'default',
      limit ? parseInt(limit) : 100,
    );
  }

  @Get('audit/statistics')
  getAuditStatistics(@Req() req: any, @Query('days') days?: string) {
    return this.auditService.getAuditStatistics(
      req.user?.tenantId || 'default',
      days ? parseInt(days) : 30,
    );
  }

  // ============ Security Incidents ============
  @Get('incidents')
  getIncidents(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('category') category?: string,
  ) {
    return this.incidentResponseService.getIncidents(req.user?.tenantId || 'default', {
      status,
      severity,
      category,
    });
  }

  @Get('incidents/:id')
  getIncident(@Param('id') id: string) {
    return this.incidentResponseService.getIncident(id);
  }

  @Post('incidents')
  reportIncident(
    @Req() req: any,
    @Body() body: {
      title: string;
      description: string;
      severity: string;
      category: string;
      affectedUsers?: number;
      affectedSystems?: string[];
    },
  ) {
    return this.incidentResponseService.reportIncident(req.user?.tenantId || 'default', {
      ...body,
      reportedBy: req.user?.id || 'system',
      ipAddress: req.ip || '127.0.0.1',
    });
  }

  @Put('incidents/:id')
  updateIncident(@Param('id') id: string, @Body() body: any) {
    return this.incidentResponseService.updateIncident(id, body);
  }

  @Post('incidents/:id/status')
  updateIncidentStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.incidentResponseService.updateIncidentStatus(
      id,
      body.status,
      req.user?.id || 'system',
      body.notes,
    );
  }

  @Post('incidents/:id/contain')
  containIncident(
    @Param('id') id: string,
    @Body() body: { actions: string[] },
  ) {
    return this.incidentResponseService.autoContainIncident(id, body.actions);
  }

  @Post('incidents/:id/forensics')
  collectForensics(
    @Param('id') id: string,
    @Body() body: { scope?: 'full' | 'partial' },
  ) {
    return this.incidentResponseService.collectForensics(id, body.scope || 'full');
  }

  @Get('incidents/:id/review')
  getIncidentReview(@Param('id') id: string) {
    return this.incidentResponseService.getIncident(id);
  }

  @Post('incidents/:id/review')
  createPostIncidentReview(
    @Param('id') id: string,
    @Body() body: {
      summary: string;
      rootCause: string;
      lessonsLearned: string[];
      improvements: string[];
      timeline: any[];
    },
  ) {
    return this.incidentResponseService.createPostIncidentReview(id, body);
  }

  @Get('incidents/metrics')
  getIncidentMetrics(@Req() req: any) {
    return this.incidentResponseService.getIncidentMetrics(req.user?.tenantId || 'default');
  }

  // ============ Compliance Endpoints ============
  @Get('compliance/controls')
  getComplianceControls(
    @Req() req: any,
    @Query('framework') framework?: string,
  ) {
    if (framework === 'SOC2') {
      return this.complianceService.getSOC2Controls(req.user?.tenantId || 'default');
    }
    return this.complianceService.getAllFrameworks(req.user?.tenantId || 'default');
  }

  @Post('compliance/controls')
  createComplianceControl(
    @Req() req: any,
    @Body() body: {
      framework: string;
      controlId: string;
      name: string;
      description: string;
      implementation: string;
      testingProcedure: string;
      owner?: string;
    },
  ) {
    if (body.framework === 'SOC2') {
      return this.complianceService.createSOC2Control(body);
    }
    return null;
  }

  @Put('compliance/controls/:id')
  updateComplianceControl(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.complianceService.updateSOC2Control(id, body);
  }

  @Get('compliance/frameworks')
  getFrameworks(@Req() req: any) {
    return this.complianceService.getAllFrameworks(req.user?.tenantId || 'default');
  }

  @Get('compliance/reports/:framework')
  getComplianceReport(
    @Req() req: any,
    @Param('framework') framework: string,
  ) {
    return this.complianceService.getComplianceReport(
      req.user?.tenantId || 'default',
      framework,
    );
  }

  @Get('compliance/score')
  getOverallComplianceScore(@Req() req: any) {
    return this.complianceService.getOverallComplianceScore(req.user?.tenantId || 'default');
  }

  @Post('compliance/initialize')
  initializeDefaultControls(@Req() req: any) {
    return this.complianceService.initializeDefaultControls(req.user?.tenantId || 'default');
  }

  // ============ GDPR Endpoints ============
  @Post('gdpr/dsar')
  createDSAR(
    @Req() req: any,
    @Body() body: {
      userId: string;
      email: string;
      requestType: string;
      details?: any;
    },
  ) {
    return this.gdprService.createDSAR(req.user?.tenantId || 'default', body);
  }

  @Get('gdpr/dsar/:id')
  getDSARById(@Req() req: any, @Param('id') id: string) {
    return this.gdprService.getDSAR(req.user?.tenantId || 'default', id);
  }

  @Get('gdpr/dsar')
  getDSARRequests(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    return this.gdprService.getDSARRequests(req.user?.tenantId || 'default', {
      status,
      userId,
    });
  }

  @Put('gdpr/dsar/:id')
  updateDSAR(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.gdprService.updateDSARStatus(id, body.status, body.notes);
  }

  @Post('gdpr/erasure')
  processDataErasure(
    @Req() req: any,
    @Body() body: {
      userId: string;
      retainLegalHolds?: boolean;
      retainFinancialRecords?: boolean;
    },
  ) {
    return this.gdprService.processDataErasure(req.user?.tenantId || 'default', body.userId, {
      retainLegalHolds: body.retainLegalHolds,
      retainFinancialRecords: body.retainFinancialRecords,
    });
  }

  @Get('gdpr/export')
  exportUserDataForGDPR(
    @Req() req: any,
    @Query('userId') userId: string,
    @Query('format') format?: string,
  ) {
    return this.gdprService.exportDataPortability(
      req.user?.tenantId || 'default',
      userId,
      (format as 'json' | 'csv') || 'json',
    );
  }

  @Post('gdpr/consent')
  recordConsent(
    @Req() req: any,
    @Body() body: {
      userId: string;
      consentType: string;
      purpose: string;
      granted: boolean;
      source: string;
    },
  ) {
    return this.gdprService.recordConsent(req.user?.tenantId || 'default', {
      ...body,
      ipAddress: req.ip,
    });
  }

  @Get('gdpr/consent/:userId')
  getUserConsents(@Req() req: any, @Param('userId') userId: string) {
    return this.gdprService.getUserConsents(req.user?.tenantId || 'default', userId);
  }

  @Get('gdpr/statistics')
  getDSARStatistics(@Req() req: any) {
    return this.gdprService.getDSARStatistics(req.user?.tenantId || 'default');
  }

  // ============ HIPAA Endpoints ============
  @Get('hipaa/phi-access')
  getPHIAccessLogs(
    @Req() req: any,
    @Query('patientId') patientId?: string,
    @Query('accessType') accessType?: string,
  ) {
    return this.hipaaService.getPHIAccessLogs(req.user?.tenantId || 'default', {
      patientId,
      accessType,
    });
  }

  @Post('hipaa/phi-access')
  logPHIAccess(
    @Req() req: any,
    @Body() body: {
      patientId: string;
      accessorId: string;
      accessorRole: string;
      accessType: string;
      resourceType: string;
      resourceId?: string;
      purpose?: string;
    },
  ) {
    return this.hipaaService.logPHIAccess(req.user?.tenantId || 'default', {
      ...body,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('hipaa/breach-report')
  reportBreach(
    @Req() req: any,
    @Body() body: {
      title: string;
      description: string;
      affectedRecords: number;
      affectedSystems: string[];
      breachDate: Date;
      discoveryDate: Date;
    },
  ) {
    return this.hipaaService.reportBreach(req.user?.tenantId || 'default', {
      ...body,
      reportedBy: req.user?.id || 'system',
    });
  }

  @Get('hipaa/breach-incidents')
  getBreachIncidents(@Req() req: any) {
    return this.hipaaService.getBreachIncidents(req.user?.tenantId || 'default');
  }

  @Get('hipaa/baa-status')
  getBAAStatus(@Req() req: any) {
    return this.hipaaService.getBAAStatus(req.user?.tenantId || 'default');
  }

  @Get('hipaa/baa')
  getBAAs(
    @Req() req: any,
    @Query('status') status?: string,
  ) {
    return this.hipaaService.getBAAs(req.user?.tenantId || 'default', status);
  }

  @Post('hipaa/baa')
  createBAA(
    @Req() req: any,
    @Body() body: {
      vendorName: string;
      vendorId?: string;
      serviceType: string;
      contactName?: string;
      contactEmail?: string;
    },
  ) {
    return this.hipaaService.createBAA(req.user?.tenantId || 'default', body);
  }

  @Put('hipaa/baa/:id')
  updateBAA(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.hipaaService.updateBAA(id, body);
  }

  @Post('hipaa/baa/:id/sign')
  signBAA(@Param('id') id: string) {
    return this.hipaaService.signBAA(id);
  }

  @Get('hipaa/encryption')
  getHIPAAEncryptionStatus(@Req() req: any) {
    return this.hipaaService.getEncryptionStatus(req.user?.tenantId || 'default');
  }

  @Get('hipaa/access-control')
  getAccessControlAudit(@Req() req: any) {
    return this.hipaaService.getAccessControlAudit(req.user?.tenantId || 'default');
  }

  // ============ Vulnerability Endpoints ============
  @Get('vulnerabilities')
  getVulnerabilities(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    return this.vulnerabilityScannerService.getVulnerabilities(
      req.user?.tenantId || 'default',
      { status, severity },
    );
  }

  @Post('vulnerabilities')
  createVulnerability(
    @Req() req: any,
    @Body() body: {
      title: string;
      description: string;
      severity: string;
      cvssScore: number;
      cveId?: string;
      affectedSystems: string[];
      affectedAssets?: string[];
      remediation?: string;
      scannerType: string;
    },
  ) {
    return this.vulnerabilityScannerService.createVulnerability(
      req.user?.tenantId || 'default',
      {
        ...body,
        affectedAssets: body.affectedAssets || body.affectedSystems,
        reportedBy: req.user?.id,
      },
    );
  }

  @Put('vulnerabilities/:id')
  updateVulnerability(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.vulnerabilityScannerService.updateVulnerability(id, body);
  }

  @Post('vulnerabilities/:id/resolve')
  resolveVulnerability(
    @Param('id') id: string,
    @Body() body: { resolution: string },
  ) {
    return this.vulnerabilityScannerService.resolveVulnerability(id, body.resolution);
  }

  @Post('vulnerabilities/:id/accept')
  acceptVulnerability(
    @Param('id') id: string,
    @Body() body: { justification: string },
  ) {
    return this.vulnerabilityScannerService.acceptVulnerability(id, body.justification);
  }

  @Post('vulnerabilities/scan')
  runVulnerabilityScan(
    @Req() req: any,
    @Body() body: { scanTypes?: string[]; targetSystems?: string[] },
  ) {
    return this.vulnerabilityScannerService.runVulnerabilityScan(
      req.user?.tenantId || 'default',
      body,
    );
  }

  @Get('vulnerabilities/report')
  getVulnerabilityReport(@Req() req: any) {
    return this.vulnerabilityScannerService.getVulnerabilityReport(
      req.user?.tenantId || 'default',
    );
  }

  @Get('vulnerabilities/scan-history')
  getScanHistory(@Req() req: any, @Query('limit') limit?: string) {
    return this.vulnerabilityScannerService.getScanHistory(
      req.user?.tenantId || 'default',
      limit ? parseInt(limit) : 10,
    );
  }

  // ============ Threat Detection Endpoints ============
  @Get('threats')
  getThreats(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    return this.threatDetectionService.getThreats(req.user?.tenantId || 'default', {
      status,
      severity,
    });
  }

  @Get('threats/:id')
  getThreat(@Param('id') id: string) {
    return this.threatDetectionService.getThreat(id);
  }

  @Post('threats/:id/block')
  blockThreat(
    @Param('id') id: string,
    @Body() body: { expiresAt?: Date },
  ) {
    return this.threatDetectionService.blockIndicator(id, body.expiresAt);
  }

  @Post('threats/:id/unblock')
  unblockThreat(@Param('id') id: string) {
    return this.threatDetectionService.unblockIndicator(id);
  }

  @Get('threats/statistics')
  getThreatStatistics(@Req() req: any, @Query('days') days?: string) {
    return this.threatDetectionService.getThreatStatistics(
      req.user?.tenantId || 'default',
      days ? parseInt(days) : 30,
    );
  }

  @Get('threats/score')
  getThreatScore(@Req() req: any) {
    return this.threatDetectionService.getThreatScore(req.user?.tenantId || 'default');
  }

  @Post('threats/sync-feeds')
  syncThreatFeeds(@Req() req: any) {
    return this.threatDetectionService.syncThreatFeeds(req.user?.tenantId || 'default');
  }

  // ============ Encryption Endpoints ============
  @Get('encryption')
  getEncryptionStatus() {
    return this.encryptionService.getEncryptionStatus();
  }

  @Post('encryption/rotate-key')
  rotateEncryptionKey() {
    return this.encryptionService.rotateKey();
  }

  @Post('encrypt')
  encryptData(@Body() data: { plaintext: string; purpose?: string }) {
    return this.encryptionService.encrypt(data.plaintext, data.purpose);
  }

  @Post('decrypt')
  decryptData(@Body() data: { ciphertext: string; purpose?: string }) {
    return this.encryptionService.decrypt(data.ciphertext, data.purpose);
  }

  // ============ MFA Endpoints ============
  @Post('mfa/setup')
  setupMfa(
    @Body() body: {
      userId: string;
      method: 'totp' | 'sms' | 'email' | 'webauthn';
      phoneNumber?: string;
      email?: string;
    },
  ) {
    return this.mfaService.setupMfa(body);
  }

  @Post('mfa/verify')
  verifyMfa(
    @Body() body: { userId: string; code: string; method: string },
  ) {
    return this.mfaService.verifyMfa(body);
  }

  @Post('mfa/disable')
  disableMfa(@Body() body: { userId: string }) {
    return this.mfaService.disableMfa(body.userId);
  }

  @Get('mfa/status/:userId')
  getMfaStatus(@Param('userId') userId: string) {
    return this.mfaService.getMfaStatus(userId);
  }

  // ============ Data Retention Endpoints ============
  @Get('retention/policies')
  getRetentionPolicies() {
    return this.dataRetentionService.getRetentionPolicies();
  }

  @Post('retention/policies')
  createRetentionPolicy(
    @Body() body: {
      dataType: string;
      description: string;
      retentionDays: number;
      legalHold: boolean;
      deletionMethod: 'anonymize' | 'delete' | 'archive';
      enabled?: boolean;
    },
  ) {
    return this.dataRetentionService.createRetentionPolicy({ ...body, enabled: true });
  }

  @Put('retention/policies/:id')
  updateRetentionPolicy(@Param('id') id: string, @Body() body: any) {
    return this.dataRetentionService.updateRetentionPolicy(id, body);
  }

  @Post('retention/apply')
  applyRetentionPolicies() {
    return this.dataRetentionService.applyRetentionPolicies();
  }

  // ============ Consent Endpoints ============
  @Get('consent/:userId')
  getUserConsent(@Param('userId') userId: string) {
    return this.consentService.getUserConsent(userId);
  }

  @Post('consent')
  updateConsent(@Body() body: any) {
    return this.consentService.updateConsent(body);
  }

  @Get('consent/:userId/data')
  exportUserConsentData(@Param('userId') userId: string) {
    return this.consentService.exportUserData(userId);
  }

  @Delete('consent/:userId')
  deleteUserData(@Param('userId') userId: string) {
    return this.consentService.deleteUserData(userId);
  }

  // ============ API Security Endpoints ============
  @Get('api-security/rate-limits')
  getRateLimits() {
    return this.apiSecurityService.getRateLimits();
  }

  @Put('api-security/rate-limits/:endpoint')
  updateRateLimit(
    @Param('endpoint') endpoint: string,
    @Body() limits: { maxRequests: number; windowSeconds: number },
  ) {
    return this.apiSecurityService.updateRateLimit(endpoint, limits);
  }

  @Get('api-security/throttle-status')
  getThrottleStatus() {
    return this.apiSecurityService.getThrottleStatus();
  }
}
