import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface Cohort {
  id: string;
  name: string;
  criteria: Record<string, unknown>;
  createdAt: Date;
  userCount?: number;
}

export interface CohortRetention {
  cohortId: string;
  periods: Array<{
    period: number;
    retentionRate: number;
    activeUsers: number;
    totalUsers: number;
  }>;
}

@Injectable()
export class CohortAnalysisService {
  private readonly logger = new Logger(CohortAnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get cohorts with pagination
   */
  async getCohorts(options: { page: number; limit: number }): Promise<{ cohorts: Cohort[]; total: number }> {
    // For now, we'll create dynamic cohorts based on user registration dates
    // In a real implementation, you might have a Cohort model in the database
    const cohorts: Cohort[] = [];
    const total = 0; // Placeholder

    return { cohorts, total };
  }

  /**
   * Create a cohort definition (stored in memory for now, could be persisted)
   */
  async createCohort(cohort: Omit<Cohort, 'id' | 'createdAt'>): Promise<Cohort> {
    const newCohort: Cohort = {
      id: `cohort_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: cohort.name,
      criteria: cohort.criteria,
      createdAt: new Date(),
    };

    // In a real implementation, you would save this to a Cohort table
    this.logger.log(`Created cohort: ${newCohort.name}`);
    return newCohort;
  }

  /**
   * Get a specific cohort
   */
  async getCohort(id: string): Promise<Cohort | null> {
    // For now, return null as we don't persist cohorts
    // In a real implementation, you would fetch from database
    return null;
  }

  /**
   * Calculate retention for cohorts based on user activity
   */
  async calculateRetention(
    cohortType: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
    metric = 'active_users',
  ): Promise<CohortRetention[]> {
    const results: CohortRetention[] = [];

    try {
      // Define cohort periods based on type
      const periods = this.getCohortPeriods(cohortType, startDate, endDate);

      for (const period of periods) {
        const cohortUsers = await this.getCohortUsers(period.startDate, period.endDate, cohortType);
        const retentionData = await this.calculateCohortRetention(cohortUsers, cohortType, metric);

        results.push({
          cohortId: period.id,
          periods: retentionData,
        });
      }

      return results;
    } catch (error) {
      this.logger.error('Failed to calculate cohort retention:', error);
      return [];
    }
  }

  /**
   * Get retention curve for a specific cohort
   */
  async getRetentionCurve(cohortId: string): Promise<CohortRetention | null> {
    // Parse cohortId to extract date and type
    const parts = cohortId.split('_');
    if (parts.length < 3) return null;

    const cohortType = parts[1] as 'daily' | 'weekly' | 'monthly';
    const cohortDate = new Date(parseInt(parts[2]));

    if (isNaN(cohortDate.getTime())) return null;

    const cohortUsers = await this.getCohortUsers(cohortDate, cohortDate, cohortType);
    const retentionData = await this.calculateCohortRetention(cohortUsers, cohortType);

    return {
      cohortId,
      periods: retentionData,
    };
  }

  /**
   * Compare multiple cohorts
   */
  async compareCohorts(cohortIds: string[]): Promise<Array<{ cohortId: string; metrics: Record<string, number> }>> {
    const results = [];

    for (const cohortId of cohortIds) {
      const retention = await this.getRetentionCurve(cohortId);
      if (retention) {
        const metrics: Record<string, number> = {};

        // Calculate average retention rate and other metrics
        if (retention.periods.length > 0) {
          const avgRetention = retention.periods.reduce((sum, p) => sum + p.retentionRate, 0) / retention.periods.length;
          const finalRetention = retention.periods[retention.periods.length - 1]?.retentionRate || 0;

          metrics.avgRetention = avgRetention;
          metrics.finalRetention = finalRetention;
          metrics.totalUsers = retention.periods[0]?.totalUsers || 0;
        }

        results.push({ cohortId, metrics });
      } else {
        results.push({ cohortId, metrics: {} });
      }
    }

    return results;
  }

  /**
   * Get cohort periods for analysis
   */
  private getCohortPeriods(cohortType: 'daily' | 'weekly' | 'monthly', startDate: Date, endDate: Date) {
    const periods = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const periodStart = new Date(current);
      let periodEnd = new Date(current);

      switch (cohortType) {
        case 'daily':
          periodEnd.setDate(periodEnd.getDate() + 1);
          break;
        case 'weekly':
          periodEnd.setDate(periodEnd.getDate() + 7);
          break;
        case 'monthly':
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          break;
      }

      periods.push({
        id: `${cohortType}_${periodStart.getTime()}`,
        startDate: periodStart,
        endDate: periodEnd,
      });

      current.setTime(periodEnd.getTime());
    }

    return periods;
  }

  /**
   * Get users for a specific cohort period
   */
  private async getCohortUsers(startDate: Date, endDate: Date, cohortType: string): Promise<string[]> {
    try {
      // Find users who first became active in this period
      const events = await this.prisma.analyticsEvent.findMany({
        where: {
          eventType: 'user_registration', // or 'first_visit', 'first_purchase', etc.
          timestamp: {
            gte: startDate,
            lt: endDate,
          },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      return events
        .map(e => e.userId)
        .filter((userId): userId is string => userId !== null);
    } catch (error) {
      this.logger.error('Failed to get cohort users:', error);
      return [];
    }
  }

  /**
   * Calculate retention for a cohort over time
   */
  private async calculateCohortRetention(
    cohortUsers: string[],
    cohortType: 'daily' | 'weekly' | 'monthly',
    metric = 'active_users',
  ): Promise<Array<{ period: number; retentionRate: number; activeUsers: number; totalUsers: number }>> {
    const totalUsers = cohortUsers.length;
    if (totalUsers === 0) return [];

    const retention = [];
    const periods = this.getRetentionPeriods(cohortType);

    for (let i = 0; i < periods; i++) {
      const periodStart = this.addPeriod(new Date(), cohortType, i);
      const periodEnd = this.addPeriod(new Date(), cohortType, i + 1);

      try {
        const activeUsers = await this.getActiveUsersInPeriod(cohortUsers, periodStart, periodEnd, metric);
        const retentionRate = totalUsers > 0 ? activeUsers / totalUsers : 0;

        retention.push({
          period: i,
          retentionRate,
          activeUsers,
          totalUsers,
        });
      } catch (error) {
        this.logger.error(`Failed to calculate retention for period ${i}:`, error);
        retention.push({
          period: i,
          retentionRate: 0,
          activeUsers: 0,
          totalUsers,
        });
      }
    }

    return retention;
  }

  /**
   * Get number of retention periods to analyze
   */
  private getRetentionPeriods(cohortType: string): number {
    switch (cohortType) {
      case 'daily':
        return 30; // 30 days
      case 'weekly':
        return 12; // 12 weeks
      case 'monthly':
        return 12; // 12 months
      default:
        return 12;
    }
  }

  /**
   * Add periods to a date
   */
  private addPeriod(date: Date, cohortType: string, periods: number): Date {
    const result = new Date(date);

    switch (cohortType) {
      case 'daily':
        result.setDate(result.getDate() + periods);
        break;
      case 'weekly':
        result.setDate(result.getDate() + periods * 7);
        break;
      case 'monthly':
        result.setMonth(result.getMonth() + periods);
        break;
    }

    return result;
  }

  /**
   * Get active users in a specific time period
   */
  private async getActiveUsersInPeriod(
    cohortUsers: string[],
    startDate: Date,
    endDate: Date,
    metric: string,
  ): Promise<number> {
    if (cohortUsers.length === 0) return 0;

    try {
      const eventTypes = this.getMetricEventTypes(metric);

      const count = await this.prisma.analyticsEvent.count({
        where: {
          userId: {
            in: cohortUsers,
          },
          eventType: {
            in: eventTypes,
          },
          timestamp: {
            gte: startDate,
            lt: endDate,
          },
        },
      });

      return count;
    } catch (error) {
      this.logger.error('Failed to get active users in period:', error);
      return 0;
    }
  }

  /**
   * Get event types that constitute "activity" for the given metric
   */
  private getMetricEventTypes(metric: string): string[] {
    switch (metric) {
      case 'page_views':
        return ['page_view', 'page_visit'];
      case 'purchases':
        return ['purchase', 'order_completed'];
      case 'engagement':
        return ['page_view', 'button_click', 'form_submit', 'video_play'];
      case 'active_users':
      default:
        return ['page_view', 'login', 'signup', 'purchase', 'application_submit'];
    }
  }
}
