import { Injectable } from '@nestjs/common';
import { AuditService } from './audit.service';

export interface Threat {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'mitigated' | 'resolved' | 'investigating';
  source: string;
  target: string;
  description: string;
  indicators: string[];
  mitigation?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

@Injectable()
export class ThreatDetectionService {
  private threats: Map<string, Threat> = new Map();
  private threatPatterns = [
    { pattern: / UNION /i, type: 'SQL Injection', severity: 'critical' as const },
    { pattern: /<script>/i, type: 'XSS', severity: 'high' as const },
    { pattern: /\.\.\//i, type: 'Path Traversal', severity: 'high' as const },
    { pattern: /(\$|\{).*\}\s*$/m, type: 'Command Injection', severity: 'critical' as const },
    { pattern: /Bearer\s+[a-zA-Z0-9\-_]+/i, type: 'Token Exposure', severity: 'medium' as const },
    { pattern: /\/\.\.\//i, type: 'Directory Traversal', severity: 'high' as const },
    { pattern: /Content-Type:\s*multipart\/form-data/i, type: 'File Upload Abuse', severity: 'medium' as const },
  ];

  constructor(private readonly auditService: AuditService) {
    // Initialize with some sample threats for demonstration
    this.initializeSampleThreats();
  }

  private initializeSampleThreats() {
    const sampleThreats: Threat[] = [
      {
        id: 'threat-001',
        type: 'Brute Force Attack',
        severity: 'medium',
        status: 'mitigated',
        source: '192.168.1.100',
        target: '/api/auth/login',
        description: 'Multiple failed login attempts detected from suspicious IP',
        indicators: ['10+ failed attempts in 5 minutes', 'Same IP address', 'Rapid request pattern'],
        mitigation: 'IP temporarily blocked, account locked',
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        resolvedAt: new Date(Date.now() - 82800000),
      },
      {
        id: 'threat-002',
        type: 'SQL Injection Attempt',
        severity: 'critical',
        status: 'resolved',
        source: '10.0.0.50',
        target: '/api/search',
        description: 'SQL injection pattern detected in search query',
        indicators: ['UNION-based payload', 'Suspicious query structure'],
        mitigation: 'Request blocked, WAF rule updated',
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 169200000),
        resolvedAt: new Date(Date.now() - 169200000),
      },
      {
        id: 'threat-003',
        type: 'Unusual Data Access',
        severity: 'high',
        status: 'active',
        source: 'Internal Network',
        target: 'User Database',
        description: 'Large volume of user records accessed outside normal hours',
        indicators: ['1000+ records in 1 minute', 'Off-hours access', 'No prior pattern'],
        mitigation: undefined,
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 3600000),
      },
    ];

    sampleThreats.forEach((threat) => this.threats.set(threat.id, threat));
  }

  async getThreats(status?: string): Promise<Threat[]> {
    const allThreats = Array.from(this.threats.values());
    
    if (status) {
      return allThreats.filter((t) => t.status === status);
    }
    
    return allThreats.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getThreat(id: string): Promise<Threat | null> {
    return this.threats.get(id) || null;
  }

  async getActiveThreatsCount(): Promise<number> {
    return Array.from(this.threats.values()).filter(
      (t) => t.status === 'active',
    ).length;
  }

  async createThreat(data: {
    type: string;
    severity: string;
    source: string;
    target: string;
    description: string;
  }): Promise<Threat> {
    const threat: Threat = {
      id: `threat-${Date.now()}`,
      type: data.type,
      severity: data.severity as Threat['severity'],
      status: 'investigating',
      source: data.source,
      target: data.target,
      description: data.description,
      indicators: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.threats.set(threat.id, threat);

    await this.auditService.log({
      action: 'THREAT_DETECTED',
      resourceType: 'security_threat',
      resourceId: threat.id,
      details: { type: threat.type, severity: threat.severity },
      ipAddress: data.source,
    });

    return threat;
  }

  async mitigateThreat(id: string): Promise<Threat | null> {
    const threat = this.threats.get(id);
    if (!threat) return null;

    threat.status = 'mitigated';
    threat.mitigation = 'Mitigation actions applied';
    threat.updatedAt = new Date();

    await this.auditService.log({
      action: 'THREAT_MITIGATED',
      resourceType: 'security_threat',
      resourceId: threat.id,
      details: { mitigation: threat.mitigation },
    });

    return threat;
  }

  async detectThreats(request: {
    path: string;
    method: string;
    body: any;
    headers: any;
    ip: string;
  }): Promise<Threat | null> {
    // Check request body for malicious patterns
    const bodyString = JSON.stringify(request.body);
    
    for (const threatPattern of this.threatPatterns) {
      if (threatPattern.pattern.test(bodyString)) {
        const threat = await this.createThreat({
          type: threatPattern.type,
          severity: threatPattern.severity,
          source: request.ip,
          target: request.path,
          description: `${threatPattern.type} attempt detected`,
        });
        return threat;
      }
    }

    // Check for unusual request patterns
    if (this.detectUnusualPattern(request)) {
      const threat = await this.createThreat({
        type: 'Unusual Request Pattern',
        severity: 'medium',
        source: request.ip,
        target: request.path,
        description: 'Unusual request pattern detected',
      });
      return threat;
    }

    return null;
  }

  private detectUnusualPattern(request: any): boolean {
    // Check for rapid requests from same IP
    const recentRequests = Array.from(this.threats.values()).filter(
      (t) =>
        t.source === request.ip &&
        t.type === 'Rate Limit Violation' &&
        Date.now() - new Date(t.createdAt).getTime() < 60000,
    );

    return recentRequests.length > 10;
  }

  async getThreatStatistics(): Promise<{
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    trend: { date: string; count: number }[];
  }> {
    const threats = Array.from(this.threats.values());

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    threats.forEach((threat) => {
      byType[threat.type] = (byType[threat.type] || 0) + 1;
      bySeverity[threat.severity] = (bySeverity[threat.severity] || 0) + 1;
      byStatus[threat.status] = (byStatus[threat.status] || 0) + 1;
    });

    // Generate trend data for last 7 days
    const trend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      const count = threats.filter(
        (t) => new Date(t.createdAt).toISOString().split('T')[0] === dateStr,
      ).length;
      trend.push({ date: dateStr, count });
    }

    return { byType, bySeverity, byStatus, trend };
  }
}
