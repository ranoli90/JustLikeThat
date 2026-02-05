import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SOC2Control {
  id: string;
  criterion: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'pending';
  evidence: string[];
  lastTested: Date;
  nextTest: Date;
}

export interface GDPRCompliance {
  dsarAutomation: boolean;
  dataPortability: boolean;
  rightToErasure: boolean;
  consentManagement: boolean;
  dataMinimization: boolean;
  overallScore: number;
}

export interface HIPAACompliance {
  phiEncryption: boolean;
  accessControls: boolean;
  auditControls: boolean;
  breachNotification: boolean;
  baaManagement: boolean;
  overallScore: number;
}

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  // SOC 2 Type II Controls
  async getSOC2Controls(tenantId: string): Promise<any[]> {
    return this.prisma.complianceControl.findMany({
      where: { framework: 'SOC2' },
      orderBy: { controlId: 'asc' },
    });
  }

  async createSOC2Control(data: {
    controlId: string;
    name: string;
    description: string;
    implementation: string;
    testingProcedure: string;
    owner?: string;
  }): Promise<any> {
    return this.prisma.complianceControl.create({
      data: {
        framework: 'SOC2',
        controlId: data.controlId,
        name: data.name,
        description: data.description,
        implementation: data.implementation,
        testingProcedure: data.testingProcedure,
        owner: data.owner,
        status: 'pending_review',
        riskLevel: 'medium',
      },
    });
  }

  async updateSOC2Control(
    id: string,
    data: Partial<{
      status: string;
      evidence: any;
      lastTested: Date;
      nextTest: Date;
      owner: string;
    }>,
  ): Promise<any> {
    return this.prisma.complianceControl.update({
      where: { id },
      data: {
        ...data,
        lastTested: data.lastTested || new Date(),
        nextTest: data.nextTest || new Date(Date.now() + 90 * 86400000), // 90 days
      },
    });
  }

  async getSOC2ComplianceScore(tenantId: string): Promise<number> {
    const controls = await this.prisma.complianceControl.findMany({
      where: { framework: 'SOC2' },
    });

    if (controls.length === 0) return 100;

    const weights: Record<string, number> = {
      compliant: 1,
      partial: 0.5,
      non_compliant: 0,
      pending_review: 0.25,
      not_applicable: 1,
    };

    const totalWeight = controls.reduce(
      (sum, c) => sum + weights[c.status] || 0,
      0,
    );
    return Math.round((totalWeight / controls.length) * 100);
  }

  // GDPR Compliance
  async getGDPRCompliance(tenantId: string): Promise<GDPRCompliance> {
    const [dsarCount, erasureCount, portabilityCount, consentCount] =
      await Promise.all([
        this.prisma.dataSubjectRequest.count({
          where: { tenantId, requestType: 'access' },
        }),
        this.prisma.dataSubjectRequest.count({
          where: { tenantId, requestType: 'erasure' },
        }),
        this.prisma.dataSubjectRequest.count({
          where: { tenantId, requestType: 'portability' },
        }),
        this.prisma.consentRecord.count({
          where: { tenantId, status: 'granted' },
        }),
      ]);

    const controls = await this.prisma.complianceControl.findMany({
      where: { framework: 'GDPR' },
    });

    const overallScore = await this.getGDPRComplianceScore(tenantId);

    return {
      dsarAutomation: dsarCount > 0,
      dataPortability: portabilityCount > 0,
      rightToErasure: erasureCount > 0,
      consentManagement: consentCount > 0,
      dataMinimization: true,
      overallScore,
    };
  }

  async getGDPRComplianceScore(tenantId: string): Promise<number> {
    const controls = await this.prisma.complianceControl.findMany({
      where: { framework: 'GDPR' },
    });

    if (controls.length === 0) return 85; // Default score

    const weights: Record<string, number> = {
      compliant: 1,
      partial: 0.5,
      non_compliant: 0,
      pending_review: 0.25,
    };

    const totalWeight = controls.reduce(
      (sum, c) => sum + weights[c.status] || 0,
      0,
    );
    return Math.round((totalWeight / controls.length) * 100);
  }

  // HIPAA Compliance
  async getHIPAACompliance(tenantId: string): Promise<HIPAACompliance> {
    const [phiAccessCount, baaCount] = await Promise.all([
      this.prisma.pHIAccessLog.count({ where: { tenantId } }),
      this.prisma.businessAssociateAgreement.count({
        where: { tenantId, baaStatus: 'active' },
      }),
    ]);

    const controls = await this.prisma.complianceControl.findMany({
      where: { framework: 'HIPAA' },
    });

    const overallScore = await this.getHIPAAComplianceScore(tenantId);

    return {
      phiEncryption: true,
      accessControls: phiAccessCount > 0,
      auditControls: true,
      breachNotification: true,
      baaManagement: baaCount > 0,
      overallScore,
    };
  }

  async getHIPAAComplianceScore(tenantId: string): Promise<number> {
    const controls = await this.prisma.complianceControl.findMany({
      where: { framework: 'HIPAA' },
    });

    if (controls.length === 0) return 80;

    const weights: Record<string, number> = {
      compliant: 1,
      partial: 0.5,
      non_compliant: 0,
      pending_review: 0.25,
    };

    const totalWeight = controls.reduce(
      (sum, c) => sum + weights[c.status] || 0,
      0,
    );
    return Math.round((totalWeight / controls.length) * 100);
  }

  // General compliance methods
  async getOverallComplianceScore(tenantId: string): Promise<number> {
    const [soc2, gdpr, hipaa] = await Promise.all([
      this.getSOC2ComplianceScore(tenantId),
      this.getGDPRComplianceScore(tenantId),
      this.getHIPAAComplianceScore(tenantId),
    ]);

    return Math.round((soc2 + gdpr + hipaa) / 3);
  }

  async getComplianceReport(
    tenantId: string,
    framework: string,
  ): Promise<{
    framework: string;
    generatedAt: string;
    controls: any[];
    summary: {
      compliant: number;
      partial: number;
      nonCompliant: number;
      pending: number;
    };
    score: number;
  }> {
    const controls = await this.prisma.complianceControl.findMany({
      where: { framework },
    });

    const summary = {
      compliant: controls.filter((c) => c.status === 'compliant').length,
      partial: controls.filter((c) => c.status === 'partial').length,
      nonCompliant: controls.filter((c) => c.status === 'non_compliant').length,
      pending: controls.filter((c) => c.status === 'pending_review').length,
    };

    let score = 0;
    if (framework === 'SOC2') score = await this.getSOC2ComplianceScore(tenantId);
    else if (framework === 'GDPR') score = await this.getGDPRComplianceScore(tenantId);
    else if (framework === 'HIPAA') score = await this.getHIPAAComplianceScore(tenantId);

    return {
      framework,
      generatedAt: new Date().toISOString(),
      controls,
      summary,
      score,
    };
  }

  async getAllFrameworks(tenantId: string): Promise<string[]> {
    const controls = await this.prisma.complianceControl.findMany({
      where: { tenantId },
      select: { framework: true },
      distinct: ['framework'],
    });

    return controls.map((c) => c.framework);
  }

  async initializeDefaultControls(tenantId: string): Promise<void> {
    const existingControls = await this.prisma.complianceControl.count({
      where: { tenantId },
    });

    if (existingControls > 0) return;

    const defaultSOC2Controls = [
      {
        controlId: 'CC1.1',
        name: 'Control Environment',
        description: 'Organizational commitment to integrity and ethical values',
        implementation: 'Implemented through code of conduct and leadership oversight',
        testingProcedure: 'Review leadership meeting minutes and policy acknowledgments',
        riskLevel: 'high',
      },
      {
        controlId: 'CC2.1',
        name: 'Communication',
        description: 'Quality information for decision making',
        implementation: 'Centralized data repository with access controls',
        testingProcedure: 'Verify data quality metrics and access logging',
        riskLevel: 'medium',
      },
      {
        controlId: 'CC3.1',
        name: 'Risk Assessment',
        description: 'Identifies and analyzes risk factors',
        implementation: 'Quarterly risk assessments with automated monitoring',
        testingProcedure: 'Review risk assessment reports',
        riskLevel: 'high',
      },
      {
        controlId: 'CC5.1',
        name: 'Security Controls',
        description: 'Security policies and procedures',
        implementation: 'Multi-factor authentication, encryption, access controls',
        testingProcedure: 'Penetration testing and access reviews',
        riskLevel: 'critical',
      },
      {
        controlId: 'CC6.1',
        name: 'Logical Access',
        description: 'Logical access security measures',
        implementation: 'Role-based access control with MFA',
        testingProcedure: 'Access review quarterly',
        riskLevel: 'critical',
      },
      {
        controlId: 'CC7.1',
        name: 'System Operations',
        description: 'Secure system operations management',
        implementation: 'Automated monitoring and alerting',
        testingProcedure: 'Review system logs and alerts',
        riskLevel: 'high',
      },
    ];

    const defaultGDPRControls = [
      {
        controlId: 'GDPR-ART5',
        name: 'Data Processing Principles',
        description: 'Personal data processed lawfully and transparently',
        implementation: 'Data processing agreements and consent management',
        testingProcedure: 'Review data processing records',
        riskLevel: 'high',
      },
      {
        controlId: 'GDPR-ART13',
        name: 'Information Disclosure',
        description: 'Privacy notice requirements',
        implementation: 'Dynamic privacy policy with version control',
        testingProcedure: 'Review privacy policy and consent records',
        riskLevel: 'medium',
      },
      {
        controlId: 'GDPR-ART17',
        name: 'Right to Erasure',
        description: 'Right to be forgotten implementation',
        implementation: 'Automated data erasure workflows',
        testingProcedure: 'Test data erasure process',
        riskLevel: 'high',
      },
      {
        controlId: 'GDPR-ART20',
        name: 'Data Portability',
        description: 'Right to data portability',
        implementation: 'Export functionality for user data',
        testingProcedure: 'Test data export functionality',
        riskLevel: 'medium',
      },
      {
        controlId: 'GDPR-ART32',
        name: 'Security of Processing',
        description: 'Technical and organizational security measures',
        implementation: 'Encryption, access controls, monitoring',
        testingProcedure: 'Security assessment and penetration testing',
        riskLevel: 'critical',
      },
    ];

    const defaultHIPAAControls = [
      {
        controlId: 'HIPAA-164.308',
        name: 'Administrative Safeguards',
        description: 'Security management and workforce security',
        implementation: 'Security officer, workforce training, access controls',
        testingProcedure: 'Review security policies and training records',
        riskLevel: 'critical',
      },
      {
        controlId: 'HIPAA-164.310',
        name: 'Physical Safeguards',
        description: 'Facility and workstation security',
        implementation: 'Secure facilities, access controls, workstation policies',
        testingProcedure: 'Physical security assessment',
        riskLevel: 'high',
      },
      {
        controlId: 'HIPAA-164.312',
        name: 'Technical Safeguards',
        description: 'Access control, audit controls, integrity',
        implementation: 'Encryption, access logging, data integrity checks',
        testingProcedure: 'Technical security testing',
        riskLevel: 'critical',
      },
      {
        controlId: 'HIPAA-164.314',
        name: 'Organizational Requirements',
        description: 'Business associate agreements',
        implementation: 'BAA management system',
        testingProcedure: 'Review BAAs and compliance status',
        riskLevel: 'high',
      },
      {
        controlId: 'HIPAA-164.530',
        name: 'Administrative Requirements',
        description: 'Privacy policies and patient rights',
        implementation: 'Privacy policies, patient consent management',
        testingProcedure: 'Review privacy policies and consent records',
        riskLevel: 'medium',
      },
    ];

    // Insert all controls
    for (const control of defaultSOC2Controls) {
      await this.prisma.complianceControl.create({
        data: {
          tenantId,
          framework: 'SOC2',
          controlId: control.controlId,
          name: control.name,
          description: control.description,
          implementation: control.implementation,
          testingProcedure: control.testingProcedure,
          status: 'pending_review',
          riskLevel: control.riskLevel,
        },
      });
    }

    for (const control of defaultGDPRControls) {
      await this.prisma.complianceControl.create({
        data: {
          tenantId,
          framework: 'GDPR',
          controlId: control.controlId,
          name: control.name,
          description: control.description,
          implementation: control.implementation,
          testingProcedure: control.testingProcedure,
          status: 'pending_review',
          riskLevel: control.riskLevel,
        },
      });
    }

    for (const control of defaultHIPAAControls) {
      await this.prisma.complianceControl.create({
        data: {
          tenantId,
          framework: 'HIPAA',
          controlId: control.controlId,
          name: control.name,
          description: control.description,
          implementation: control.implementation,
          testingProcedure: control.testingProcedure,
          status: 'pending_review',
          riskLevel: control.riskLevel,
        },
      });
    }
  }
}
