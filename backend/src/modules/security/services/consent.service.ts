import { Injectable } from '@nestjs/common';

export interface ConsentRecord {
  userId: string;
  consentType: string;
  granted: boolean;
  version: string;
  grantedAt?: string;
  revokedAt?: string;
  ipAddress?: string;
}

export interface ConsentConfig {
  id: string;
  name: string;
  description: string;
  required: boolean;
  version: string;
  enabled: boolean;
}

@Injectable()
export class ConsentService {
  private consentConfigs: ConsentConfig[] = [
    {
      id: 'consent-001',
      name: 'Terms of Service',
      description: 'Acceptance of platform terms of service',
      required: true,
      version: '1.0',
      enabled: true,
    },
    {
      id: 'consent-002',
      name: 'Privacy Policy',
      description: 'Acknowledgment of privacy practices',
      required: true,
      version: '1.0',
      enabled: true,
    },
    {
      id: 'consent-003',
      name: 'Marketing Communications',
      description: 'Consent to receive marketing emails',
      required: false,
      version: '1.0',
      enabled: true,
    },
    {
      id: 'consent-004',
      name: 'Analytics',
      description: 'Consent to usage analytics and improvements',
      required: false,
      version: '1.0',
      enabled: true,
    },
    {
      id: 'consent-005',
      name: 'Third-Party Data Sharing',
      description: 'Consent to share data with third parties',
      required: false,
      version: '1.0',
      enabled: true,
    },
  ];

  private userConsents: Map<string, ConsentRecord[]> = new Map();

  async getUserConsent(userId: string): Promise<{
    userId: string;
    consents: ConsentRecord[];
    config: ConsentConfig[];
  }> {
    let consents = this.userConsents.get(userId) || [];

    // Ensure all consent types have records
    for (const config of this.consentConfigs) {
      if (!consents.find((c) => c.consentType === config.id)) {
        consents.push({
          userId,
          consentType: config.id,
          granted: false,
          version: config.version,
        });
      }
    }

    return {
      userId,
      consents,
      config: this.consentConfigs,
    };
  }

  async updateConsent(data: {
    userId: string;
    consentType: string;
    granted: boolean;
    version: string;
  }): Promise<ConsentRecord> {
    let consents = this.userConsents.get(data.userId) || [];
    const existingIndex = consents.findIndex((c) => c.consentType === data.consentType);

    const record: ConsentRecord = {
      userId: data.userId,
      consentType: data.consentType,
      granted: data.granted,
      version: data.version,
      grantedAt: data.granted ? new Date().toISOString() : undefined,
      revokedAt: !data.granted ? new Date().toISOString() : undefined,
    };

    if (existingIndex >= 0) {
      consents[existingIndex] = record;
    } else {
      consents.push(record);
    }

    this.userConsents.set(data.userId, consents);

    return record;
  }

  async exportUserData(userId: string): Promise<{
    userId: string;
    exportedAt: string;
    data: {
      consentRecords: ConsentRecord[];
      profileData?: any;
      applicationData?: any;
    };
  }> {
    const consents = this.userConsents.get(userId) || [];

    return {
      userId,
      exportedAt: new Date().toISOString(),
      data: {
        consentRecords: consents,
      },
    };
  }

  async deleteUserData(userId: string): Promise<{
    success: boolean;
    deletedAt: string;
    retainedData: string[];
  }> {
    // In production, this would:
    // 1. Anonymize user data
    // 2. Delete personal information
    // 3. Keep necessary records for legal compliance
    // 4. Update audit logs

    // Remove consent records
    this.userConsents.delete(userId);

    return {
      success: true,
      deletedAt: new Date().toISOString(),
      retainedData: ['audit_logs', 'legal_hold_data'],
    };
  }

  async getConsentConfigs(): Promise<ConsentConfig[]> {
    return this.consentConfigs;
  }

  async updateConsentConfig(
    id: string,
    data: Partial<ConsentConfig>,
  ): Promise<ConsentConfig | null> {
    const index = this.consentConfigs.findIndex((c) => c.id === id);
    if (index === -1) return null;

    this.consentConfigs[index] = {
      ...this.consentConfigs[index],
      ...data,
    };

    return this.consentConfigs[index];
  }

  async getConsentStats(): Promise<{
    totalUsers: number;
    byType: Record<string, { granted: number; denied: number }>;
    consentRate: number;
  }> {
    const byType: Record<string, { granted: number; denied: number }> = {};

    this.userConsents.forEach((consents) => {
      consents.forEach((consent) => {
        if (!byType[consent.consentType]) {
          byType[consent.consentType] = { granted: 0, denied: 0 };
        }
        if (consent.granted) {
          byType[consent.consentType].granted++;
        } else {
          byType[consent.consentType].denied++;
        }
      });
    });

    return {
      totalUsers: this.userConsents.size,
      byType,
      consentRate: 0.75, // Placeholder
    };
  }
}
