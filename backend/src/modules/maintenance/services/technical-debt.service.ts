// Technical Debt Service - Sprint 48
// Implements code quality analysis, debt identification, and tracking

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TechnicalDebt } from '../entities/technical-debt.entity';
import { CodeQualityMetrics } from '../entities/code-quality-metrics.entity';
import { SonarQubeService } from './sonar-qube.service';

export interface TechnicalDebtItem {
  id?: string;
  category: 'code' | 'database' | 'security' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  filePath: string;
  lineNumber?: number;
  estimatedHours: number;
  actualHours?: number;
  status: 'identified' | 'planned' | 'in_progress' | 'completed' | 'accepted';
}

export interface QualityMetrics {
  serviceName: string;
  coverage: number;
  complexity: number;
  duplication: number;
  securityRating: string;
  maintainability: number;
  technicalDebt: number;
}

export interface DebtSummary {
  totalItems: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  estimatedHoursTotal: number;
  actualHoursTotal: number;
  reductionPercentage: number;
}

@Injectable()
export class TechnicalDebtService {
  private readonly logger = new Logger(TechnicalDebtService.name);

  constructor(
    @InjectRepository(TechnicalDebt)
    private readonly debtRepository: Repository<TechnicalDebt>,
    @InjectRepository(CodeQualityMetrics)
    private readonly metricsRepository: Repository<CodeQualityMetrics>,
    private readonly sonarQubeService: SonarQubeService,
  ) {}

  // ==================== TECHNICAL DEBT CRUD ====================

  async createTechnicalDebt(data: TechnicalDebtItem): Promise<TechnicalDebt> {
    this.logger.log(`Creating technical debt item: ${data.description}`);
    
    const debt = this.debtRepository.create({
      category: data.category,
      severity: data.severity,
      description: data.description,
      filePath: data.filePath,
      lineNumber: data.lineNumber,
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours,
      status: data.status,
    });

    return this.debtRepository.save(debt);
  }

  async getAllTechnicalDebt(filters?: {
    category?: string;
    severity?: string;
    status?: string;
  }): Promise<TechnicalDebt[]> {
    const where: any = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.status) where.status = filters.status;

    return this.debtRepository.find({
      where,
      order: { severity: 'DESC', createdAt: 'DESC' },
    });
  }

  async getTechnicalDebtById(id: string): Promise<TechnicalDebt | null> {
    return this.debtRepository.findOne({ where: { id } });
  }

  async updateTechnicalDebt(id: string, data: Partial<TechnicalDebtItem>): Promise<TechnicalDebt | null> {
    this.logger.log(`Updating technical debt item: ${id}`);
    
    await this.debtRepository.update(id, {
      ...data,
      updatedAt: new Date(),
    });

    return this.getTechnicalDebtById(id);
  }

  async deleteTechnicalDebt(id: string): Promise<void> {
    this.logger.log(`Deleting technical debt item: ${id}`);
    await this.debtRepository.delete(id);
  }

  // ==================== QUALITY METRICS ====================

  async recordQualityMetrics(metrics: QualityMetrics): Promise<CodeQualityMetrics> {
    const record = this.metricsRepository.create({
      serviceName: metrics.serviceName,
      coverage: metrics.coverage,
      complexity: metrics.complexity,
      duplication: metrics.duplication,
      securityRating: metrics.securityRating,
      maintainability: metrics.maintainability,
      technicalDebt: metrics.technicalDebt,
    });

    return this.metricsRepository.save(record);
  }

  async getQualityMetrics(serviceName?: string, days: number = 30): Promise<CodeQualityMetrics[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const where: any = {
      date: { $gte: cutoffDate },
    };
    
    if (serviceName) {
      where.serviceName = serviceName;
    }

    return this.metricsRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async getLatestQualityMetrics(): Promise<CodeQualityMetrics[]> {
    // Get latest metrics for each service using raw query
    const result = await this.debtRepository.manager.query(`
      SELECT DISTINCT ON (serviceName) * 
      FROM code_quality_metrics 
      ORDER BY serviceName, date DESC
    `);
    return result;
  }

  // ==================== DEBT ANALYSIS ====================

  async getDebtSummary(): Promise<DebtSummary> {
    const items = await this.debtRepository.find();

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let estimatedHoursTotal = 0;
    let actualHoursTotal = 0;

    items.forEach((item) => {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
      bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      estimatedHoursTotal += item.estimatedHours;
      if (item.actualHours) actualHoursTotal += item.actualHours;
    });

    const completedItems = items.filter((i) => i.status === 'completed');
    const acceptedItems = items.filter((i) => i.status === 'accepted');
    const reductionPercentage = items.length > 0
      ? ((completedItems.length + acceptedItems.length) / items.length) * 100
      : 0;

    return {
      totalItems: items.length,
      byCategory,
      bySeverity,
      byStatus,
      estimatedHoursTotal,
      actualHoursTotal,
      reductionPercentage,
    };
  }

  async identifyDebtFromSonarQube(): Promise<TechnicalDebtItem[]> {
    const sonarIssues = await this.sonarQubeService.getIssues();
    const debtItems: TechnicalDebtItem[] = [];

    for (const issue of sonarIssues) {
      const debtItem: TechnicalDebtItem = {
        category: this.mapIssueTypeToCategory(issue.type),
        severity: this.mapSeverity(issue.severity),
        description: issue.message,
        filePath: issue.component,
        lineNumber: issue.line,
        estimatedHours: this.estimateHours(issue.type, issue.severity),
        status: 'identified',
      };
      debtItems.push(debtItem);
    }

    // Batch create debt items
    for (const item of debtItems) {
      await this.createTechnicalDebt(item);
    }

    return debtItems;
  }

  async getRefactoringSuggestions(debtId: string): Promise<string[]> {
    const debt = await this.getTechnicalDebtById(debtId);
    if (!debt) return [];

    const suggestions: string[] = [];

    switch (debt.category) {
      case 'code':
        suggestions.push('Consider extracting method to reduce complexity');
        suggestions.push('Review and simplify conditional logic');
        suggestions.push('Apply SOLID principles for better maintainability');
        break;
      case 'database':
        suggestions.push('Add missing indexes for query optimization');
        suggestions.push('Normalize data structure if denormalization detected');
        suggestions.push('Consider partitioning large tables');
        break;
      case 'security':
        suggestions.push('Implement proper input validation');
        suggestions.push('Add rate limiting for sensitive endpoints');
        suggestions.push('Review and update authentication flows');
        break;
      case 'performance':
        suggestions.push('Add caching layer for frequently accessed data');
        suggestions.push('Optimize N+1 query patterns');
        suggestions.push('Consider async processing for heavy operations');
        break;
    }

    return suggestions;
  }

  // ==================== DEBT TRACKING ====================

  async getDebtReductionMetrics(startDate: Date, endDate: Date): Promise<any> {
    const startMetrics = await this.metricsRepository.findOne({
      where: { date: endDate as any },
      order: { date: 'ASC' },
    });

    const endMetrics = await this.metricsRepository.findOne({
      where: { date: startDate as any },
      order: { date: 'DESC' },
    });

    const startDebt = await this.debtRepository.count();

    const endDebt = await this.debtRepository.count();

    const reduction = startDebt > 0 ? ((startDebt - endDebt) / startDebt) * 100 : 0;

    return {
      startDate,
      endDate,
      startDebtCount: startDebt,
      endDebtCount: endDebt,
      reductionPercentage: Math.round(reduction * 100) / 100,
      startMetrics,
      endMetrics,
      coverageImprovement: startMetrics && endMetrics
        ? endMetrics.coverage - startMetrics.coverage
        : 0,
      technicalDebtReduction: startMetrics && endMetrics
        ? startMetrics.technicalDebt - endMetrics.technicalDebt
        : 0,
    };
  }

  // ==================== HELPER METHODS ====================

  private mapIssueTypeToCategory(type: string): TechnicalDebtItem['category'] {
    const mapping: Record<string, TechnicalDebtItem['category']> = {
      CODE_SMELL: 'code',
      BUG: 'code',
      VULNERABILITY: 'security',
      SECURITY_HOTSPOT: 'security',
    };
    return mapping[type] || 'code';
  }

  private mapSeverity(severity: string): TechnicalDebtItem['severity'] {
    const mapping: Record<string, TechnicalDebtItem['severity']> = {
      BLOCKER: 'critical',
      CRITICAL: 'high',
      MAJOR: 'medium',
      MINOR: 'low',
      INFO: 'low',
    };
    return mapping[severity] || 'medium';
  }

  private estimateHours(type: string, severity: string): number {
    const baseHours: Record<string, number> = {
      BUG: 8,
      VULNERABILITY: 4,
      CODE_SMELL: 2,
      SECURITY_HOTSPOT: 6,
    };

    const severityMultipliers: Record<string, number> = {
      BLOCKER: 2,
      CRITICAL: 1.5,
      MAJOR: 1,
      MINOR: 0.5,
      INFO: 0.25,
    };

    const base = baseHours[type] || 2;
    const multiplier = severityMultipliers[severity] || 1;
    return base * multiplier;
  }
}
