import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

export interface Threat {
  id: string;
  type: string;
  severity: string;
  status: string;
  source: string;
  target: string;
  description: string;
  indicators: string[];
  mitigation?: string;
  threatScore: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ThreatDetectionService {
  private threatPatterns = [
    { pattern: / UNION /i, type: 'SQL Injection', severity: 'critical', score: 90 },
    { pattern: /<script>/i, type: 'XSS', severity: 'high', score: 75 },
    { pattern: /\.\.\//i, type: 'Path Traversal', severity: 'high', score: 70 },
    { pattern: /(\$|\{).*\}\s*$/m, type: 'Command Injection', severity: 'critical', score: 95 },
    { pattern: /Bearer\s+[a-zA-Z0-9\-_]+/i, type: 'Token Exposure', severity: 'medium', score: 50 },
    { pattern: /\/\.\.\//i, type: 'Directory Traversal', severity: 'high', score: 70 },
    { pattern: /Content-Type:\s*multipart\/form-data/i, type: 'File Upload Abuse', severity: 'medium', score: 45 },
    { pattern: /Authorization:\s*Basic/i, type: 'Basic Auth Exposure', severity: 'high', score: 60 },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getThreats(
    tenantId: string,
    filters?: { status?: string; severity?: string },
  ): Promise<any[]> {
    const where: any = { tenantId };

    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;

    return this.prisma.threatIntelligence.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getThreat(id: string): Promise<any> {
    return this.prisma.threatIntelligence.findUnique({ where: { id } });
  }

  async createThreat(
    tenantId: string,
    data: {
      type: string;
      severity: string;
      source: string;
      target: string;
      description: string;
      confidence?: number;
    },
  ): Promise<any> {
    return this.prisma.threatIntelligence.create({
      data: {
        tenantId,
        indicatorType: 'generic',
        indicator: data.source,
        threatType: data.type,
        severity: data.severity,
        source: 'internal',
        confidence: data.confidence || 0.5,
        description: data.description,
        firstSeen: new Date(),
        lastSeen: new Date(),
        isBlocked: false,
      },
    });
  }

  async detectThreats(
    tenantId: string,
    request: {
      path: string;
      method: string;
      body: any;
      headers: any;
      ip: string;
      userId?: string;
    },
  ): Promise<{ detected: boolean; threat?: any; action?: string }> {
    // Check request body for malicious patterns
    const bodyString = JSON.stringify(request.body);

    for (const threatPattern of this.threatPatterns) {
      if (threatPattern.pattern.test(bodyString)) {
        const threat = await this.createThreat(tenantId, {
          type: threatPattern.type,
          severity: threatPattern.severity,
          source: request.ip,
          target: request.path,
          description: `${threatPattern.type} attempt detected in request body`,
          confidence: threatPattern.score / 100,
        });

        await this.auditService.log({
          tenantId,
          userId: request.userId,
          action: 'THREAT_DETECTED',
          resource: 'security_threat',
          resourceId: threat.id,
          ipAddress: request.ip,
          details: {
            type: threatPattern.type,
            severity: threatPattern.severity,
            pattern: threatPattern.pattern.source,
          },
          riskLevel: threatPattern.severity,
        });

        return {
          detected: true,
          threat,
          action: 'BLOCK',
        };
      }
    }

    // Check for unusual patterns
    const behavioralScore = await this.calculateBehavioralScore(request);

    if (behavioralScore > 80) {
      const threat = await this.createThreat(tenantId, {
        type: 'Behavioral Anomaly',
        severity: 'high',
        source: request.ip,
        target: request.path,
        description: 'Unusual behavioral pattern detected',
        confidence: 0.8,
      });

      return {
        detected: true,
        threat,
        action: 'FLAG',
      };
    }

    return { detected: false };
  }

  async calculateBehavioralScore(request: any): Promise<number> {
    let score = 0;

    // Check request rate (simplified)
    const recentRequests = await this.prisma.threatIntelligence.count({
      where: {
        indicator: request.ip,
        createdAt: { gte: new Date(Date.now() - 60000) },
      },
    });

    if (recentRequests > 10) score += 30;
    if (recentRequests > 50) score += 40;

    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'via'];
    const headerCount = suspiciousHeaders.filter(
      (h) => request.headers[h],
    ).length;
    score += headerCount * 10;

    // Check for automation indicators
    const automationIndicators = ['curl', 'wget', 'python-requests', 'bot'];
    const hasAutomation = automationIndicators.some((indicator) =>
      request.headers['user-agent']?.toLowerCase().includes(indicator),
    );
    if (hasAutomation) score += 20;

    return Math.min(100, score);
  }

  async blockIndicator(
    id: string,
    expiresAt?: Date,
  ): Promise<any> {
    return this.prisma.threatIntelligence.update({
      where: { id },
      data: {
        isBlocked: true,
        expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
  }

  async unblockIndicator(id: string): Promise<any> {
    return this.prisma.threatIntelligence.update({
      where: { id },
      data: { isBlocked: false },
    });
  }

  async getThreatStatistics(
    tenantId: string,
    days: number = 30,
  ): Promise<{
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    blockedCount: number;
    trend: { date: string; count: number }[];
  }> {
    const startDate = new Date(Date.now() - days * 86400000);

    const threats = await this.prisma.threatIntelligence.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
    });

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    threats.forEach((threat) => {
      byType[threat.threatType] = (byType[threat.threatType] || 0) + 1;
      bySeverity[threat.severity] = (bySeverity[threat.severity] || 0) + 1;
      byStatus[threat.isBlocked ? 'blocked' : 'monitored'] =
        (byStatus[threat.isBlocked ? 'blocked' : 'monitored'] || 0) + 1;

      const day = threat.createdAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    const trend: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      trend.push({ date: dateStr, count: byDay[dateStr] || 0 });
    }

    return {
      byType,
      bySeverity,
      byStatus,
      blockedCount: threats.filter((t) => t.isBlocked).length,
      trend,
    };
  }

  async getThreatScore(tenantId: string): Promise<number> {
    const recentThreats = await this.prisma.threatIntelligence.findMany({
      where: {
        tenantId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    let score = 0;

    recentThreats.forEach((threat) => {
      const severityWeights: Record<string, number> = {
        critical: 10,
        high: 7,
        medium: 4,
        low: 1,
      };
      score += severityWeights[threat.severity] || 0;
    });

    // Normalize to 0-100
    return Math.min(100, score);
  }

  async getActiveThreatsCount(tenantId: string): Promise<number> {
    return this.prisma.threatIntelligence.count({
      where: {
        tenantId,
        isBlocked: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
  }

  // Threat Intelligence Feeds Integration
  async syncThreatFeeds(tenantId: string): Promise<{
    indicatorsAdded: number;
    indicatorsUpdated: number;
    sources: string[];
  }> {
    // In production, this would integrate with external threat intelligence feeds
    // For now, we'll simulate with some sample data
    const sampleIndicators = [
      {
        indicator: '192.168.1.100',
        indicatorType: 'ip',
        threatType: 'malware',
        severity: 'high',
        source: 'sample-feed',
      },
      {
        indicator: 'malicious-domain.com',
        indicatorType: 'domain',
        threatType: 'phishing',
        severity: 'critical',
        source: 'sample-feed',
      },
    ];

    let added = 0;
    let updated = 0;

    for (const indicator of sampleIndicators) {
      const existing = await this.prisma.threatIntelligence.findFirst({
        where: {
          tenantId,
          indicator: indicator.indicator,
          indicatorType: indicator.indicatorType,
        },
      });

      if (existing) {
        await this.prisma.threatIntelligence.update({
          where: { id: existing.id },
          data: {
            lastSeen: new Date(),
            confidence: 0.9,
          },
        });
        updated++;
      } else {
        await this.prisma.threatIntelligence.create({
          data: {
            tenantId,
            indicatorType: indicator.indicatorType,
            indicator: indicator.indicator,
            threatType: indicator.threatType,
            severity: indicator.severity,
            source: indicator.source,
            confidence: 0.7,
            firstSeen: new Date(),
            lastSeen: new Date(),
            isBlocked: false,
          },
        });
        added++;
      }
    }

    return {
      indicatorsAdded: added,
      indicatorsUpdated: updated,
      sources: ['sample-feed'],
    };
  }
}
