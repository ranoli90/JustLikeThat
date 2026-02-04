import { Injectable } from '@nestjs/common';
import { ThreatDetectionService } from './threat-detection.service';
import { EncryptionService } from './encryption.service';
import { AuditService } from './audit.service';
import { MfaService } from './mfa.service';
import { ComplianceService } from './compliance.service';
import { DataRetentionService } from './data-retention.service';
import { ConsentService } from './consent.service';
import { IncidentResponseService } from './incident-response.service';
import { ApiSecurityService } from './api-security.service';
import { VulnerabilityScannerService } from './vulnerability-scanner.service';

@Injectable()
export class SecurityService {
  constructor(
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

  async getSecurityDashboard() {
    const [
      activeThreats,
      encryptionStatus,
      mfaStats,
      complianceScore,
      openIncidents,
      vulnerabilities,
      rateLimitStats,
    ] = await Promise.all([
      this.threatDetectionService.getActiveThreatsCount(),
      this.encryptionService.getEncryptionStatus(),
      this.mfaService.getMfaStats(),
      this.complianceService.getOverallComplianceScore(),
      this.incidentResponseService.getOpenIncidentsCount(),
      this.vulnerabilityScannerService.getVulnerabilitySummary(),
      this.apiSecurityService.getRateLimitStats(),
    ]);

    return {
      overview: {
        securityScore: this.calculateSecurityScore(
          activeThreats,
          complianceScore,
          vulnerabilities,
          openIncidents,
        ),
        lastScan: new Date().toISOString(),
        status: this.determineOverallStatus(
          activeThreats,
          vulnerabilities,
          openIncidents,
        ),
      },
      activeThreats,
      encryptionStatus,
      mfaStats,
      complianceScore,
      openIncidents,
      vulnerabilities,
      rateLimitStats,
      recommendations: this.generateRecommendations(
        activeThreats,
        complianceScore,
        vulnerabilities,
      ),
    };
  }

  private calculateSecurityScore(
    activeThreats: number,
    complianceScore: number,
    vulnerabilities: any,
    openIncidents: number,
  ): number {
    let score = 100;

    // Deduct for active threats
    score -= activeThreats * 5;

    // Deduct for compliance issues
    score -= (100 - complianceScore) * 0.3;

    // Deduct for critical vulnerabilities
    score -= (vulnerabilities.critical || 0) * 10;
    score -= (vulnerabilities.high || 0) * 5;
    score -= (vulnerabilities.medium || 0) * 2;

    // Deduct for open incidents
    score -= openIncidents * 3;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private determineOverallStatus(
    activeThreats: number,
    vulnerabilities: any,
    openIncidents: number,
  ): 'healthy' | 'warning' | 'critical' {
    if (
      activeThreats > 0 ||
      (vulnerabilities.critical || 0) > 0 ||
      openIncidents > 0
    ) {
      return 'critical';
    }
    if (
      (vulnerabilities.high || 0) > 0 ||
      (vulnerabilities.medium || 0) > 3
    ) {
      return 'warning';
    }
    return 'healthy';
  }

  private generateRecommendations(
    activeThreats: number,
    complianceScore: number,
    vulnerabilities: any,
  ): string[] {
    const recommendations: string[] = [];

    if (activeThreats > 0) {
      recommendations.push(
        'Immediate attention required: Active security threats detected',
      );
    }

    if (complianceScore < 80) {
      recommendations.push(
        'Review and update compliance measures to improve security posture',
      );
    }

    if ((vulnerabilities.critical || 0) > 0) {
      recommendations.push(
        'Critical vulnerabilities found - immediate patching required',
      );
    }

    if ((vulnerabilities.high || 0) > 0) {
      recommendations.push(
        'High severity vulnerabilities should be addressed promptly',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Security posture is strong - continue monitoring and regular scans',
      );
    }

    return recommendations;
  }
}
