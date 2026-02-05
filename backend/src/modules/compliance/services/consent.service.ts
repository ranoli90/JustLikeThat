import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordConsent(data: {
    userId: string;
    tenantId: string;
    consentType: string;
    regulation?: string;
    consentGiven: boolean;
    consentVersion?: string;
    consentMethod?: string;
    consentIp?: string;
    legalBasis?: string;
    purpose?: string;
    userAgent?: string;
    source?: string;
  }): Promise<any> {
    return this.prisma.consentRecord.create({
      data: {
        ...data,
        consentedAt: new Date(),
      },
    });
  }

  async withdrawConsent(userId: string, consentType: string): Promise<any> {
    return this.prisma.consentRecord.updateMany({
      where: { userId, consentType },
      data: { withdrawnAt: new Date(), consentGiven: false },
    });
  }

  async renewConsent(userId: string, consentType: string, data: {
    consentGiven: boolean;
    consentVersion?: string;
    consentMethod?: string;
  }): Promise<any> {
    return this.prisma.consentRecord.updateMany({
      where: { userId, consentType },
      data: {
        ...data,
        renewedAt: new Date(),
        withdrawnAt: data.consentGiven ? null : new Date(),
      },
    });
  }

  async getConsentHistory(userId: string): Promise<any[]> {
    return this.prisma.consentRecord.findMany({
      where: { userId },
      orderBy: { consentedAt: 'desc' },
    });
  }

  async hasActiveConsent(
    userId: string,
    consentType: string,
  ): Promise<boolean> {
    const consent = await this.prisma.consentRecord.findFirst({
      where: {
        userId,
        consentType,
        consentGiven: true,
        withdrawnAt: null,
      },
    });
    return !!consent;
  }

  async getConsentByType(
    userId: string,
    consentType: string,
  ): Promise<any | null> {
    return this.prisma.consentRecord.findFirst({
      where: { userId, consentType },
      orderBy: { consentedAt: 'desc' },
    });
  }

  async getConsentStats(tenantId: string): Promise<{
    totalUsers: number;
    consentedUsers: number;
    withdrawnUsers: number;
    consentRate: number;
    byType: Record<string, { consented: number; withdrawn: number }>;
  }> {
    const allConsents = await this.prisma.consentRecord.findMany({
      where: { tenantId },
    });

    const uniqueUsers = new Set(allConsents.map(c => c.userId));
    const consentedUsers = new Set(
      allConsents.filter(c => c.consentGiven && !c.withdrawnAt).map(c => c.userId)
    );
    const withdrawnUsers = new Set(
      allConsents.filter(c => c.withdrawnAt).map(c => c.userId)
    );

    const byType: Record<string, { consented: number; withdrawn: number }> = {};
    for (const consent of allConsents) {
      if (!byType[consent.consentType]) {
        byType[consent.consentType] = { consented: 0, withdrawn: 0 };
      }
      if (consent.consentGiven && !consent.withdrawnAt) {
        byType[consent.consentType].consented++;
      } else if (consent.withdrawnAt) {
        byType[consent.consentType].withdrawn++;
      }
    }

    return {
      totalUsers: uniqueUsers.size,
      consentedUsers: consentedUsers.size,
      withdrawnUsers: withdrawnUsers.size,
      consentRate: uniqueUsers.size > 0 ? consentedUsers.size / uniqueUsers.size : 0,
      byType,
    };
  }
}
