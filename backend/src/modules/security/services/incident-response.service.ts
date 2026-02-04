import { Injectable } from '@nestjs/common';

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  category: string;
  affectedUsers?: string[];
  affectedSystems?: string[];
  timeline: {
    timestamp: string;
    action: string;
    performedBy?: string;
    notes?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
}

@Injectable()
export class IncidentResponseService {
  private incidents: Map<string, SecurityIncident> = new Map();

  constructor() {
    // Initialize with sample incidents
    this.initializeSampleIncidents();
  }

  private initializeSampleIncidents() {
    const sampleIncidents: SecurityIncident[] = [
      {
        id: 'incident-001',
        title: 'Suspicious Login Activity',
        description: 'Multiple failed login attempts detected from unusual location',
        severity: 'medium',
        status: 'resolved',
        category: 'Unauthorized Access',
        affectedUsers: ['user-123'],
        affectedSystems: ['auth-service'],
        timeline: [
          {
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            action: 'Incident detected',
          },
          {
            timestamp: new Date(Date.now() - 82800000).toISOString(),
            action: 'Account temporarily locked',
            performedBy: 'system',
          },
          {
            timestamp: new Date(Date.now() - 79200000).toISOString(),
            action: 'User notified via email',
          },
          {
            timestamp: new Date(Date.now() - 75600000).toISOString(),
            action: 'Investigation completed',
            performedBy: 'security-team',
          },
          {
            timestamp: new Date(Date.now() - 72000000).toISOString(),
            action: 'Incident resolved',
            performedBy: 'security-team',
          },
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 72000000).toISOString(),
        resolvedAt: new Date(Date.now() - 72000000).toISOString(),
      },
      {
        id: 'incident-002',
        title: 'Data Exposure Risk',
        description: 'Potential exposure of user data due to misconfigured API endpoint',
        severity: 'high',
        status: 'investigating',
        category: 'Data Breach',
        affectedUsers: ['user-456', 'user-789'],
        affectedSystems: ['api-gateway'],
        timeline: [
          {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            action: 'Vulnerability reported by security researcher',
          },
          {
            timestamp: new Date(Date.now() - 3000000).toISOString(),
            action: 'Incident created and assigned',
            performedBy: 'system',
          },
          {
            timestamp: new Date(Date.now() - 2400000).toISOString(),
            action: 'Affected endpoint temporarily disabled',
            performedBy: 'devops-team',
          },
        ],
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 2400000).toISOString(),
      },
    ];

    sampleIncidents.forEach((incident) => this.incidents.set(incident.id, incident));
  }

  async getIncidents(status?: string): Promise<SecurityIncident[]> {
    const allIncidents = Array.from(this.incidents.values());
    if (status) {
      return allIncidents.filter((i) => i.status === status);
    }
    return allIncidents.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getIncident(id: string): Promise<SecurityIncident | null> {
    return this.incidents.get(id) || null;
  }

  async getOpenIncidentsCount(): Promise<number> {
    return Array.from(this.incidents.values()).filter(
      (i) => i.status !== 'resolved' && i.status !== 'closed',
    ).length;
  }

  async reportIncident(data: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    affectedUsers?: string[];
    affectedSystems?: string[];
    reportedBy?: string;
  }): Promise<SecurityIncident> {
    const incident: SecurityIncident = {
      id: `incident-${Date.now()}`,
      title: data.title,
      description: data.description,
      severity: data.severity,
      status: 'open',
      category: data.category,
      affectedUsers: data.affectedUsers,
      affectedSystems: data.affectedSystems,
      timeline: [
        {
          timestamp: new Date().toISOString(),
          action: 'Incident reported',
          performedBy: data.reportedBy,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.incidents.set(incident.id, incident);
    return incident;
  }

  async updateIncident(
    id: string,
    data: Partial<SecurityIncident>,
  ): Promise<SecurityIncident | null> {
    const incident = this.incidents.get(id);
    if (!incident) return null;

    const updated: SecurityIncident = {
      ...incident,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.incidents.set(id, updated);
    return updated;
  }

  async updateIncidentStatus(
    id: string,
    status: SecurityIncident['status'],
    notes?: string,
  ): Promise<SecurityIncident | null> {
    const incident = this.incidents.get(id);
    if (!incident) return null;

    incident.status = status;
    incident.updatedAt = new Date().toISOString();

    incident.timeline.push({
      timestamp: new Date().toISOString(),
      action: `Status changed to ${status}`,
      notes,
    });

    if (status === 'resolved' || status === 'closed') {
      incident.resolvedAt = new Date().toISOString();
    }

    this.incidents.set(id, incident);
    return incident;
  }

  async resolveIncident(id: string): Promise<SecurityIncident | null> {
    return this.updateIncidentStatus(id, 'resolved', 'Incident resolved');
  }

  async addTimelineEntry(
    id: string,
    entry: { action: string; performedBy?: string; notes?: string },
  ): Promise<SecurityIncident | null> {
    const incident = this.incidents.get(id);
    if (!incident) return null;

    incident.timeline.push({
      timestamp: new Date().toISOString(),
      ...entry,
    });
    incident.updatedAt = new Date().toISOString();

    this.incidents.set(id, incident);
    return incident;
  }

  async getIncidentStatistics(): Promise<{
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    averageResolutionTime: number;
    incidentsLast30Days: number;
  }> {
    const incidents = Array.from(this.incidents.values());

    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    incidents.forEach((incident) => {
      bySeverity[incident.severity] = (bySeverity[incident.severity] || 0) + 1;
      byStatus[incident.status] = (byStatus[incident.status] || 0) + 1;
      byCategory[incident.category] = (byCategory[incident.category] || 0) + 1;
    });

    // Calculate incidents in last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const incidentsLast30Days = incidents.filter(
      (i) => new Date(i.createdAt).getTime() > thirtyDaysAgo,
    ).length;

    // Calculate average resolution time (in hours)
    const resolvedIncidents = incidents.filter((i) => i.resolvedAt);
    const totalResolutionTime = resolvedIncidents.reduce((sum, i) => {
      return sum + (new Date(i.resolvedAt!).getTime() - new Date(i.createdAt).getTime());
    }, 0);
    const averageResolutionTime = resolvedIncidents.length > 0
      ? totalResolutionTime / resolvedIncidents.length / 3600000
      : 0;

    return {
      bySeverity,
      byStatus,
      byCategory,
      averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
      incidentsLast30Days,
    };
  }
}
