import { Injectable, NotFoundException } from '@nestjs/common';
import { dataStore } from '../data-store';
import { CreateQAReportDto, PaginationQueryDto } from '../dto/maturity.dto';
import { PaginatedResponse, QAReport } from '../interfaces/maturity.interface';

@Injectable()
export class QualityAssuranceService {
  createReport(dto: CreateQAReportDto): QAReport {
    return dataStore.qaReportCreate({
      releaseId: dto.releaseId,
      testType: dto.testType,
      environment: dto.environment,
      coverage: dto.coverage,
      issues: dto.issues,
      resolvedIssues: [],
      status: 'pending',
      executedBy: dto.executedBy,
      executedAt: new Date(),
    });
  }

  findAllReports(query: PaginationQueryDto, filters?: {
    releaseId?: string;
    testType?: string;
    status?: string;
  }): PaginatedResponse<QAReport> {
    const { page = 1, limit = 20 } = query;
    let reports = dataStore.qaReportFindMany();

    if (filters?.releaseId) {
      reports = reports.filter(r => r.releaseId === filters.releaseId);
    }
    if (filters?.testType) {
      reports = reports.filter(r => r.testType === filters.testType);
    }
    if (filters?.status) {
      reports = reports.filter(r => r.status === filters.status);
    }

    reports.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());

    const total = reports.length;
    const start = (page - 1) * limit;
    const data = reports.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findReportById(id: string): QAReport {
    const report = dataStore.qaReportFindUnique(id);
    if (!report) {
      throw new NotFoundException(`QA report with ID ${id} not found`);
    }
    return report;
  }

  updateReportStatus(id: string, status: string, resolvedIssues?: any[]): QAReport {
    const report = this.findReportById(id);
    return dataStore.qaReportUpdate(id, {
      status: status as QAReport['status'],
      resolvedIssues: resolvedIssues || report.resolvedIssues,
      completedAt: status === 'passed' || status === 'failed' ? new Date() : undefined,
    });
  }

  executeTests(suiteId: string, environment: string): any {
    return {
      id: crypto.randomUUID(),
      suiteId,
      status: 'passed',
      passed: 10,
      failed: 0,
      skipped: 0,
      duration: 45,
      completedAt: new Date(),
    };
  }

  getLatestReport(releaseId: string, testType: string): QAReport | null {
    const reports = dataStore.qaReportFindMany()
      .filter(r => r.releaseId === releaseId && r.testType === testType)
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
    return reports[0] || null;
  }

  getStats() {
    const reports = dataStore.qaReportFindMany();

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    reports.forEach(r => {
      byType[r.testType] = (byType[r.testType] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });

    const avgCoverage = reports.length > 0
      ? reports.reduce((sum, r) => sum + r.coverage, 0) / reports.length
      : 0;

    return {
      totalReports: reports.length,
      byType,
      byStatus,
      averageCoverage: Math.round(avgCoverage * 10) / 10,
    };
  }
}
