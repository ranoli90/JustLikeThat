import { Injectable } from '@nestjs/common';

export interface ComplianceCheck {
  id: string;
  category: string;
  requirement: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'pending';
  lastChecked: string;
  details?: string;
}

export interface GdprCompliance {
  dataProcessing: ComplianceCheck[];
  dataSubjectRights: ComplianceCheck[];
  dataSecurity: ComplianceCheck[];
  overallScore: number;
}

export interface CcpaCompliance {
  privacyRights: ComplianceCheck[];
  dataCollection: ComplianceCheck[];
  disclosure: ComplianceCheck[];
  overallScore: number;
}

@Injectable()
export class ComplianceService {
  private complianceChecks: ComplianceCheck[] = [
    // GDPR Data Processing
    {
      id: 'gdpr-001',
      category: 'Data Processing',
      requirement: 'Lawful basis for processing documented',
      status: 'compliant',
      lastChecked: new Date().toISOString(),
      details: 'All processing activities have documented lawful basis',
    },
    {
      id: 'gdpr-002',
      category: 'Data Processing',
      requirement: 'Data minimization implemented',
      status: 'compliant',
      lastChecked: new Date().toISOString(),
      details: 'Only necessary data is collected and processed',
    },
    {
      id: 'gdpr-003',
      category: 'Data Processing',
      requirement: 'Purpose limitation enforced',
      status: 'compliant',
      lastChecked: new Date().toISOString(),
    },
    // GDPR Data Subject Rights
    {
      id: 'gdpr-004',
      category: 'Data Subject Rights',
      requirement: 'Right to access implemented',
      status: 'compliant',
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'gdpr-005',
      category: 'Data Subject Rights',
      requirement: 'Right to erasure implemented',
      status: 'compliant',
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'gdpr-006',
      category: 'Data Subject Rights',
      requirement: 'Right to portability implemented',
      status: 'partial',
      lastChecked: new Date().toISOString(),
      details: 'Partial implementation - standard formats supported',
    },
    // CCPA Privacy Rights
    {
      id: 'ccpa-001',
      category: 'Privacy Rights',
      requirement: 'Right to know about data collection',
      status: 'compliant',
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'ccpa-002',
      category: 'Privacy Rights',
      requirement: 'Right to delete personal information',
      status: 'compliant',
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'ccpa-003',
      category: 'Privacy Rights',
      requirement: 'Right to opt-out of sale',
      status: 'partial',
      lastChecked: new Date().toISOString(),
      details: 'Opt-out mechanism available but not prominently displayed',
    },
  ];

  async getGdprCompliance(): Promise<GdprCompliance> {
    const dataProcessing = this.complianceChecks.filter((c) => c.category === 'Data Processing');
    const dataSubjectRights = this.complianceChecks.filter((c) => c.category === 'Data Subject Rights');
    const dataSecurity = this.complianceChecks.filter((c) => c.category === 'Data Security');

    const overallScore = this.calculateOverallScore([
      ...dataProcessing,
      ...dataSubjectRights,
      ...dataSecurity,
    ]);

    return {
      dataProcessing,
      dataSubjectRights,
      dataSecurity,
      overallScore,
    };
  }

  async getCcpaCompliance(): Promise<CcpaCompliance> {
    const privacyRights = this.complianceChecks.filter((c) => c.category === 'Privacy Rights');
    const dataCollection = this.complianceChecks.filter((c) => c.category === 'Data Collection');
    const disclosure = this.complianceChecks.filter((c) => c.category === 'Disclosure');

    const overallScore = this.calculateOverallScore([
      ...privacyRights,
      ...dataCollection,
      ...disclosure,
    ]);

    return {
      privacyRights,
      dataCollection,
      disclosure,
      overallScore,
    };
  }

  async getOverallComplianceScore(): Promise<number> {
    return this.calculateOverallScore(this.complianceChecks);
  }

  async getComplianceReport(type: string): Promise<{
    type: string;
    generatedAt: string;
    checks: ComplianceCheck[];
    summary: {
      compliant: number;
      partial: number;
      nonCompliant: number;
      pending: number;
    };
  }> {
    let checks = this.complianceChecks;

    if (type === 'gdpr') {
      checks = this.complianceChecks.filter(
        (c) =>
          c.category === 'Data Processing' ||
          c.category === 'Data Subject Rights' ||
          c.category === 'Data Security',
      );
    } else if (type === 'ccpa') {
      checks = this.complianceChecks.filter(
        (c) =>
          c.category === 'Privacy Rights' ||
          c.category === 'Data Collection' ||
          c.category === 'Disclosure',
      );
    }

    const summary = {
      compliant: checks.filter((c) => c.status === 'compliant').length,
      partial: checks.filter((c) => c.status === 'partial').length,
      nonCompliant: checks.filter((c) => c.status === 'non-compliant').length,
      pending: checks.filter((c) => c.status === 'pending').length,
    };

    return {
      type,
      generatedAt: new Date().toISOString(),
      checks,
      summary,
    };
  }

  async addComplianceCheck(check: Omit<ComplianceCheck, 'id' | 'lastChecked'>): Promise<ComplianceCheck> {
    const newCheck: ComplianceCheck = {
      ...check,
      id: `check-${Date.now()}`,
      lastChecked: new Date().toISOString(),
    };

    this.complianceChecks.push(newCheck);
    return newCheck;
  }

  async updateComplianceCheck(
    id: string,
    update: Partial<ComplianceCheck>,
  ): Promise<ComplianceCheck | null> {
    const index = this.complianceChecks.findIndex((c) => c.id === id);
    if (index === -1) return null;

    this.complianceChecks[index] = {
      ...this.complianceChecks[index],
      ...update,
      lastChecked: new Date().toISOString(),
    };

    return this.complianceChecks[index];
  }

  private calculateOverallScore(checks: ComplianceCheck[]): number {
    if (checks.length === 0) return 100;

    const weights = {
      compliant: 1,
      partial: 0.5,
      'non-compliant': 0,
      pending: 0.25,
    };

    const totalWeight = checks.reduce((sum, check) => sum + weights[check.status], 0);
    return Math.round((totalWeight / checks.length) * 100);
  }
}
