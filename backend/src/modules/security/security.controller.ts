import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// DTOs
interface ThreatDetectionDto {
  type: string;
  severity: string;
  source: string;
  target: string;
  description: string;
}

interface MfaSetupDto {
  userId: string;
  method: 'totp' | 'sms' | 'email' | 'webauthn';
  phoneNumber?: string;
  email?: string;
}

interface MfaVerifyDto {
  userId: string;
  code: string;
  method: string;
}

interface DataRetentionPolicyDto {
  dataType: string;
  description: string;
  retentionDays: number;
  legalHold: boolean;
  deletionMethod: 'anonymize' | 'delete' | 'archive';
  enabled?: boolean;
}

interface ConsentDto {
  userId: string;
  consentType: string;
  granted: boolean;
  version: string;
}

interface IncidentReportDto {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  affectedUsers?: string[];
  affectedSystems?: string[];
}

@Controller('api/security')
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
  ) {}

  // Dashboard
  @Get('dashboard')
  getDashboard() {
    return this.securityService.getSecurityDashboard();
  }

  // Threat Detection
  @Get('threats')
  getThreats(@Query('status') status?: string) {
    return this.threatDetectionService.getThreats(status);
  }

  @Get('threats/:id')
  getThreat(@Param('id') id: string) {
    return this.threatDetectionService.getThreat(id);
  }

  @Post('threats')
  createThreat(@Body() dto: ThreatDetectionDto) {
    return this.threatDetectionService.createThreat(dto);
  }

  @Post('threats/:id/mitigate')
  mitigateThreat(@Param('id') id: string) {
    return this.threatDetectionService.mitigateThreat(id);
  }

  // Encryption
  @Get('encryption/status')
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

  // Audit
  @Get('audit/logs')
  getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getAuditLogs({ userId, action, startDate, endDate });
  }

  @Get('audit/logs/:id')
  getAuditLog(@Param('id') id: string) {
    return this.auditService.getAuditLog(id);
  }

  @Get('audit/export')
  exportAuditLogs(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.auditService.exportAuditLogs(startDate, endDate);
  }

  // MFA
  @Post('mfa/setup')
  setupMfa(@Body() dto: MfaSetupDto) {
    return this.mfaService.setupMfa(dto);
  }

  @Post('mfa/verify')
  verifyMfa(@Body() dto: MfaVerifyDto) {
    return this.mfaService.verifyMfa(dto);
  }

  @Post('mfa/disable')
  disableMfa(@Body() dto: { userId: string }) {
    return this.mfaService.disableMfa(dto.userId);
  }

  @Get('mfa/status/:userId')
  getMfaStatus(@Param('userId') userId: string) {
    return this.mfaService.getMfaStatus(userId);
  }

  // Compliance
  @Get('compliance/gdpr')
  getGdprCompliance() {
    return this.complianceService.getGdprCompliance();
  }

  @Get('compliance/ccpa')
  getCcpaCompliance() {
    return this.complianceService.getCcpaCompliance();
  }

  @Get('compliance/report')
  getComplianceReport(@Query('type') type: string) {
    return this.complianceService.getComplianceReport(type);
  }

  // Data Retention
  @Get('retention/policies')
  getRetentionPolicies() {
    return this.dataRetentionService.getRetentionPolicies();
  }

  @Post('retention/policies')
  createRetentionPolicy(@Body() dto: DataRetentionPolicyDto) {
    return this.dataRetentionService.createRetentionPolicy({ ...dto, enabled: dto.enabled ?? true });
  }

  @Put('retention/policies/:id')
  updateRetentionPolicy(@Param('id') id: string, @Body() dto: DataRetentionPolicyDto) {
    return this.dataRetentionService.updateRetentionPolicy(id, dto);
  }

  @Post('retention/apply')
  applyRetentionPolicies() {
    return this.dataRetentionService.applyRetentionPolicies();
  }

  // Consent
  @Get('consent/:userId')
  getUserConsent(@Param('userId') userId: string) {
    return this.consentService.getUserConsent(userId);
  }

  @Post('consent')
  updateConsent(@Body() dto: ConsentDto) {
    return this.consentService.updateConsent(dto);
  }

  @Get('consent/:userId/export')
  exportUserData(@Param('userId') userId: string) {
    return this.consentService.exportUserData(userId);
  }

  @Delete('consent/:userId')
  deleteUserData(@Param('userId') userId: string) {
    return this.consentService.deleteUserData(userId);
  }

  // Incident Response
  @Get('incidents')
  getIncidents(@Query('status') status?: string) {
    return this.incidentResponseService.getIncidents(status);
  }

  @Get('incidents/:id')
  getIncident(@Param('id') id: string) {
    return this.incidentResponseService.getIncident(id);
  }

  @Post('incidents')
  reportIncident(@Body() dto: IncidentReportDto) {
    return this.incidentResponseService.reportIncident(dto);
  }

  @Put('incidents/:id')
  updateIncident(@Param('id') id: string, @Body() dto: Partial<IncidentReportDto>) {
    return this.incidentResponseService.updateIncident(id, dto);
  }

  @Post('incidents/:id/resolve')
  resolveIncident(@Param('id') id: string) {
    return this.incidentResponseService.resolveIncident(id);
  }

  // API Security
  @Get('api-security/rate-limits')
  getRateLimits() {
    return this.apiSecurityService.getRateLimits();
  }

  @Put('api-security/rate-limits/:endpoint')
  updateRateLimit(@Param('endpoint') endpoint: string, @Body() limits: { maxRequests: number; windowSeconds: number }) {
    return this.apiSecurityService.updateRateLimit(endpoint, limits);
  }

  @Get('api-security/throttle-status')
  getThrottleStatus() {
    return this.apiSecurityService.getThrottleStatus();
  }

  // Vulnerability Scanner
  @Get('vulnerabilities')
  getVulnerabilities() {
    return this.vulnerabilityScannerService.getVulnerabilities();
  }

  @Post('vulnerabilities/scan')
  runVulnerabilityScan() {
    return this.vulnerabilityScannerService.runVulnerabilityScan();
  }

  @Post('vulnerabilities/:id/patch')
  patchVulnerability(@Param('id') id: string) {
    return this.vulnerabilityScannerService.patchVulnerability(id);
  }

  @Get('vulnerabilities/report')
  getVulnerabilityReport() {
    return this.vulnerabilityScannerService.getVulnerabilityReport();
  }
}
