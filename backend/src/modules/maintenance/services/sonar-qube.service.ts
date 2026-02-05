// SonarQube Integration Service - Sprint 48
// Provides integration with SonarQube for code quality analysis

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SonarQubeIssue {
  key: string;
  component: string;
  line: number;
  message: string;
  type: string;
  severity: string;
  status: string;
  effort: string;
}

export interface SonarQubeMetrics {
  coverage: number;
  duplicatedLinesDensity: number;
  codeSmells: number;
  bugs: number;
  vulnerabilities: number;
  securityHotspots: number;
  reliabilityRating: string;
  securityRating: string;
  maintainabilityRating: string;
}

@Injectable()
export class SonarQubeService {
  private readonly logger = new Logger(SonarQubeService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get('SONARQUBE_URL', 'http://localhost:9000');
    this.token = this.configService.get('SONARQUBE_TOKEN', '');
  }

  // ==================== ISSUE MANAGEMENT ====================

  async getIssues(filters?: {
    component?: string;
    severity?: string;
    type?: string;
    status?: string;
  }): Promise<SonarQubeIssue[]> {
    this.logger.log('Fetching SonarQube issues');
    
    // Mock implementation - in production, this would call the SonarQube API
    const mockIssues: SonarQubeIssue[] = [
      {
        key: 'issue-1',
        component: 'src/modules/user/user.service.ts',
        line: 42,
        message: 'Refactor this function to reduce cognitive complexity',
        type: 'CODE_SMELL',
        severity: 'MAJOR',
        status: 'OPEN',
        effort: '30min',
      },
      {
        key: 'issue-2',
        component: 'src/modules/auth/auth.service.ts',
        line: 15,
        message: 'Add password hashing using a secure algorithm',
        type: 'VULNERABILITY',
        severity: 'CRITICAL',
        status: 'OPEN',
        effort: '2h',
      },
      {
        key: 'issue-3',
        component: 'src/modules/database/database.service.ts',
        line: 78,
        message: 'Add index on frequently queried column',
        type: 'CODE_SMELL',
        severity: 'MINOR',
        status: 'OPEN',
        effort: '15min',
      },
      {
        key: 'issue-4',
        component: 'src/modules/api/api.controller.ts',
        line: 100,
        message: 'Remove this dead code',
        type: 'CODE_SMELL',
        severity: 'INFO',
        status: 'OPEN',
        effort: '10min',
      },
      {
        key: 'issue-5',
        component: 'src/modules/payment/payment.service.ts',
        line: 55,
        message: 'Fix this bug that causes duplicate charges',
        type: 'BUG',
        severity: 'BLOCKER',
        status: 'OPEN',
        effort: '4h',
      },
    ];

    // Apply filters if provided
    let filteredIssues = mockIssues;
    if (filters?.severity) {
      filteredIssues = filteredIssues.filter(i => i.severity === filters.severity);
    }
    if (filters?.type) {
      filteredIssues = filteredIssues.filter(i => i.type === filters.type);
    }
    if (filters?.component) {
      filteredIssues = filteredIssues.filter(i => i.component?.includes(filters.component || ''));
    }

    return filteredIssues;
  }

  async getIssueByKey(key: string): Promise<SonarQubeIssue | null> {
    const issues = await this.getIssues();
    return issues.find(i => i.key === key) || null;
  }

  async getHotspots(): Promise<SonarQubeIssue[]> {
    this.logger.log('Fetching security hotspots');
    const issues = await this.getIssues();
    return issues.filter(i => i.type === 'SECURITY_HOTSPOT' || i.type === 'VULNERABILITY');
  }

  // ==================== QUALITY GATES ====================

  async getQualityGateStatus(component: string): Promise<{
    status: string;
    conditions: Array<{ metric: string; value: string; operator: string; status: string }>;
  }> {
    this.logger.log(`Fetching quality gate status for: ${component}`);
    
    // Mock implementation
    return {
      status: 'WARN',
      conditions: [
        { metric: 'coverage', value: '78.5', operator: '<', status: 'FAILED' },
        { metric: 'duplicated_lines_density', value: '3.2', operator: '>', status: 'PASSED' },
        { metric: 'code_smells', value: '150', operator: '<', status: 'PASSED' },
        { metric: 'vulnerabilities', value: '0', operator: '>', status: 'PASSED' },
        { metric: 'bugs', value: '2', operator: '<', status: 'PASSED' },
      ],
    };
  }

  // ==================== METRICS ====================

  async getComponentMetrics(component: string): Promise<SonarQubeMetrics> {
    this.logger.log(`Fetching metrics for: ${component}`);
    
    // Mock implementation
    return {
      coverage: 78.5,
      duplicatedLinesDensity: 3.2,
      codeSmells: 150,
      bugs: 2,
      vulnerabilities: 1,
      securityHotspots: 3,
      reliabilityRating: 'A',
      securityRating: 'B',
      maintainabilityRating: 'A',
    };
  }

  async getCodeCoverage(component: string): Promise<number> {
    const metrics = await this.getComponentMetrics(component);
    return metrics.coverage;
  }

  async getDuplicationRate(component: string): Promise<number> {
    const metrics = await this.getComponentMetrics(component);
    return metrics.duplicatedLinesDensity;
  }

  async getComplexityMetrics(component: string): Promise<{
    cognitiveComplexity: number;
    cyclomaticComplexity: number;
    functions: number;
    classes: number;
  }> {
    this.logger.log(`Fetching complexity metrics for: ${component}`);
    
    return {
      cognitiveComplexity: 45,
      cyclomaticComplexity: 120,
      functions: 85,
      classes: 15,
    };
  }

  // ==================== ANALYSIS ====================

  async triggerAnalysis(projectKey: string, branch?: string): Promise<{ taskId: string }> {
    this.logger.log(`Triggering analysis for project: ${projectKey}`);
    
    // Mock implementation - in production, this would trigger a SonarQube scan
    return {
      taskId: `task-${Date.now()}`,
    };
  }

  async getAnalysisStatus(taskId: string): Promise<{
    status: string;
    analyzedAt?: Date;
    errors?: string[];
  }> {
    return {
      status: 'COMPLETED',
      analyzedAt: new Date(),
    };
  }

  async getNewIssuesSince(lastAnalysisDate: Date): Promise<SonarQubeIssue[]> {
    const allIssues = await this.getIssues();
    // In production, filter by date comparison
    return allIssues.slice(0, 3);
  }

  // ==================== RULES ====================

  async getActiveRules(): Promise<Array<{
    key: string;
    name: string;
    severity: string;
    type: string;
    status: string;
  }>> {
    return [
      { key: 'js:S1234', name: 'Cognitive complexity should not be too high', severity: 'MAJOR', type: 'CODE_SMELL', status: 'ACTIVE' },
      { key: 'js:S4784', name: 'Using a cookie is security-sensitive', severity: 'CRITICAL', type: 'SECURITY_HOTSPOT', status: 'ACTIVE' },
      { key: 'js:S3655', name: 'Dependencies should be up to date', severity: 'MAJOR', type: 'CODE_SMELL', status: 'ACTIVE' },
      { key: 'js:S2089', name: 'Comments should not be located at the end of code lines', severity: 'MINOR', type: 'CODE_SMELL', status: 'ACTIVE' },
      { key: 'js:S1145', name: 'Loop conditions should not be tautological', severity: 'CRITICAL', type: 'BUG', status: 'ACTIVE' },
    ];
  }

  // ==================== TECHNICAL DEBT ====================

  async calculateTechnicalDebt(): Promise<{
    totalDebt: number; // in hours
    debtByCategory: Record<string, number>;
    debtBySeverity: Record<string, number>;
  }> {
    const issues = await this.getIssues();
    
    const debtByCategory: Record<string, number> = {};
    const debtBySeverity: Record<string, number> = {};
    let totalDebt = 0;

    for (const issue of issues) {
      const debtMinutes = parseInt(issue.effort.replace(/\D/g, '')) || 30;
      const debtHours = debtMinutes / 60;
      
      totalDebt += debtHours;
      
      const category = issue.type.toLowerCase().replace('_', '-');
      debtByCategory[category] = (debtByCategory[category] || 0) + debtHours;
      
      const severity = issue.severity.toLowerCase();
      debtBySeverity[severity] = (debtBySeverity[severity] || 0) + debtHours;
    }

    return { totalDebt, debtByCategory, debtBySeverity };
  }
}
