import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClickHouseService } from './clickhouse.service';
import { ReportConfig, ReportDataConfig, ReportExport } from '../interfaces/analytics.interface';
import { v4 as uuidv4 } from 'uuid';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportBuilderService {
  private readonly logger = new Logger(ReportBuilderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clickhouse: ClickHouseService,
  ) {}

  // Report Management
  async createReport(
    userId: string,
    report: Omit<ReportConfig, 'id'>,
  ): Promise<ReportConfig> {
    const created = await this.prisma.report.create({
      data: {
        userId,
        name: report.name,
        description: report.description,
        type: report.type,
        config: report.config as any,
        schedule: report.schedule as any,
      },
    });

    return this.mapPrismaReport(created);
  }

  async getReport(reportId: string): Promise<ReportConfig> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }

    return this.mapPrismaReport(report);
  }

  async getReports(
    userId: string,
    pagination: { page: number; limit: number },
  ): Promise<{ reports: ReportConfig[]; total: number }> {
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.report.count({ where: { userId } }),
    ]);

    return {
      reports: reports.map((r) => this.mapPrismaReport(r)),
      total,
    };
  }

  async updateReport(
    reportId: string,
    userId: string,
    updates: Partial<ReportConfig>,
  ): Promise<ReportConfig> {
    const report = await this.prisma.report.update({
      where: { id: reportId, userId },
      data: {
        name: updates.name,
        description: updates.description,
        config: updates.config as any,
        schedule: updates.schedule as any,
      },
    });

    return this.mapPrismaReport(report);
  }

  async deleteReport(reportId: string, userId: string): Promise<void> {
    await this.prisma.report.delete({
      where: { id: reportId, userId },
    });
  }

  // Report Generation
  async generateReport(
    reportId: string,
    format: 'pdf' | 'excel' | 'csv',
  ): Promise<ReportExport> {
    const report = await this.getReport(reportId);
    const config = report.config;

    // Create export record
    const exportRecord = await this.prisma.reportExport.create({
      data: {
        reportId,
        format,
        status: 'processing',
      },
    });

    try {
      // Generate data based on config
      const data = await this.executeReportQuery(config);

      // Generate file based on format
      let fileUrl: string;
      switch (format) {
        case 'pdf':
          fileUrl = await this.generatePDF(data, report);
          break;
        case 'excel':
          fileUrl = await this.generateExcel(data, report);
          break;
        case 'csv':
          fileUrl = await this.generateCSV(data, report);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Update export record
      await this.prisma.reportExport.update({
        where: { id: exportRecord.id },
        data: {
          status: 'completed',
          fileUrl,
          completedAt: new Date(),
        },
      });

      // Update last run time
      await this.prisma.report.update({
        where: { id: reportId },
        data: { lastRunAt: new Date() },
      });

      return {
        id: exportRecord.id,
        reportId: exportRecord.reportId,
        format: exportRecord.format,
        status: 'completed',
        fileUrl,
        requestedAt: exportRecord.requestedAt,
        completedAt: new Date(),
      };
    } catch (error) {
      await this.prisma.reportExport.update({
        where: { id: exportRecord.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  async getExportStatus(exportId: string): Promise<ReportExport> {
    const exportRecord = await this.prisma.reportExport.findUnique({
      where: { id: exportId },
    });

    if (!exportRecord) {
      throw new NotFoundException(`Export ${exportId} not found`);
    }

    return {
      id: exportRecord.id,
      reportId: exportRecord.reportId,
      format: exportRecord.format as 'pdf' | 'excel' | 'csv',
      status: exportRecord.status as 'pending' | 'processing' | 'completed' | 'failed',
      fileUrl: exportRecord.fileUrl || undefined,
      error: exportRecord.error || undefined,
      requestedAt: exportRecord.requestedAt,
      completedAt: exportRecord.completedAt || undefined,
    };
  }

  // Scheduled Reports
  async getScheduledReports(): Promise<ReportConfig[]> {
    const reports = await this.prisma.report.findMany({
      where: {
        type: 'scheduled',
        schedule: { not: null },
      },
    });

    return reports.map((r) => this.mapPrismaReport(r));
  }

  async scheduleReport(
    reportId: string,
    schedule: ReportConfig['schedule'],
  ): Promise<ReportConfig> {
    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        type: 'scheduled',
        schedule: schedule as any,
        nextRunAt: this.calculateNextRunTime(schedule!),
      },
    });

    return this.mapPrismaReport(report);
  }

  async processScheduledReports(): Promise<void> {
    const now = new Date();
    const reports = await this.prisma.report.findMany({
      where: {
        type: 'scheduled',
        nextRunAt: { lte: now },
      },
    });

    for (const report of reports) {
      try {
        await this.generateReport(report.id, 'pdf');
        
        // Update next run time
        if (report.schedule) {
          await this.prisma.report.update({
            where: { id: report.id },
            data: {
              nextRunAt: this.calculateNextRunTime(report.schedule as any),
            },
          });
        }
      } catch (error) {
        this.logger.error(`Failed to process scheduled report ${report.id}`, error);
      }
    }
  }

  // Report Templates
  async getReportTemplates(): Promise<any[]> {
    // Return built-in report templates
    return [
      {
        id: 'user-activity',
        name: 'User Activity Report',
        description: 'Comprehensive user activity metrics and trends',
        type: 'dashboard',
        config: {
          metrics: ['page_views', 'sessions', 'users', 'bounce_rate'],
          dateRange: { start: '30d', end: 'now' },
        },
      },
      {
        id: 'conversion-funnel',
        name: 'Conversion Funnel Report',
        description: 'Funnel conversion analysis and drop-off rates',
        type: 'custom',
        config: {
          metrics: ['funnel_step_1', 'funnel_step_2', 'funnel_step_3', 'conversion_rate'],
          dateRange: { start: '7d', end: 'now' },
        },
      },
      {
        id: 'cohort-retention',
        name: 'Cohort Retention Report',
        description: 'User cohort analysis and retention curves',
        type: 'custom',
        config: {
          metrics: ['cohort_size', 'retention_d1', 'retention_d7', 'retention_d30'],
          dateRange: { start: '90d', end: 'now' },
        },
      },
      {
        id: 'ab-test-results',
        name: 'A/B Test Results Report',
        description: 'A/B test performance and statistical significance',
        type: 'custom',
        config: {
          metrics: ['sample_size', 'conversion_rate', 'p_value', 'improvement'],
          dateRange: { start: '14d', end: 'now' },
        },
      },
    ];
  }

  // Data Query Methods
  private async executeReportQuery(config: ReportDataConfig): Promise<any[]> {
    const { metrics, dimensions, dateRange, aggregations } = config;

    // Build ClickHouse query
    const metricSelect = metrics.map((m) => `countIf(eventType = '${m}') as ${m}`).join(', ');
    const query = `
      SELECT 
        ${metricSelect}
      FROM analytics.events
      WHERE timestamp >= {startDate:DateTime64(3)}
        AND timestamp <= {endDate:DateTime64(3)}
    `;

    return this.clickhouse.query(query, {
      startDate: dateRange.start,
      endDate: dateRange.end,
    });
  }

  private async generatePDF(data: any[], report: ReportConfig): Promise<string> {
    // In production, this would generate an actual PDF file
    // For now, return a placeholder URL
    return `https://storage.example.com/reports/${report.id}.pdf`;
  }

  private async generateExcel(data: any[], report: ReportConfig): Promise<string> {
    // In production, this would generate an actual Excel file
    return `https://storage.example.com/reports/${report.id}.xlsx`;
  }

  private async generateCSV(data: any[], report: ReportConfig): Promise<string> {
    // In production, this would generate an actual CSV file
    return `https://storage.example.com/reports/${report.id}.csv`;
  }

  private calculateNextRunTime(schedule: ReportConfig['schedule']): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    switch (schedule.frequency) {
      case 'daily':
        if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        const targetDay = schedule.dayOfWeek || 0;
        const currentDay = now.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil < 0 || (daysUntil === 0 && nextRun <= now)) {
          daysUntil += 7;
        }
        nextRun.setDate(nextRun.getDate() + daysUntil);
        break;
      case 'monthly':
        const targetDate = schedule.dayOfMonth || 1;
        nextRun.setDate(targetDate);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }

    return nextRun;
  }

  // Helper methods
  private mapPrismaReport(report: any): ReportConfig {
    return {
      id: report.id,
      userId: report.userId,
      name: report.name,
      description: report.description || undefined,
      type: report.type,
      config: report.config,
      schedule: report.schedule,
      lastRunAt: report.lastRunAt,
      nextRunAt: report.nextRunAt,
    };
  }
}
