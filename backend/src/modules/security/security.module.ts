import { Module, Global } from '@nestjs/common';
import { SecurityController } from './security.controller';
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
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [SecurityController],
  providers: [
    SecurityService,
    ThreatDetectionService,
    EncryptionService,
    AuditService,
    MfaService,
    ComplianceService,
    DataRetentionService,
    ConsentService,
    IncidentResponseService,
    ApiSecurityService,
    VulnerabilityScannerService,
    GDPRService,
    HIPAAService,
  ],
  exports: [
    SecurityService,
    ThreatDetectionService,
    EncryptionService,
    AuditService,
    MfaService,
    ComplianceService,
    DataRetentionService,
    ConsentService,
    IncidentResponseService,
    ApiSecurityService,
    VulnerabilityScannerService,
    GDPRService,
    HIPAAService,
  ],
})
export class SecurityModule {}
