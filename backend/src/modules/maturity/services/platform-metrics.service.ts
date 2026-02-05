import { Injectable } from '@nestjs/common';
import { dataStore } from '../data-store';
import { CreatePlatformMetricsDto } from '../dto/maturity.dto';
import { PlatformMetrics } from '../interfaces/maturity.interface';

@Injectable()
export class PlatformMetricsService {
  create(dto: CreatePlatformMetricsDto): PlatformMetrics {
    // Calculate overall score
    const overallScore = (
      (dto.uptime * 0.25) +
      (dto.performance * 0.25) +
      (dto.security * 0.2) +
      (dto.userSatisfaction * 0.15) +
      (dto.costEfficiency * 0.15)
    );

    return dataStore.platformMetricsCreate({
      date: new Date(),
      uptime: dto.uptime,
      performance: dto.performance,
      security: dto.security,
      userSatisfaction: dto.userSatisfaction,
      costEfficiency: dto.costEfficiency,
      overallScore: Math.round(overallScore * 10) / 10,
      incidentsCount: dto.incidentsCount || 0,
      deploymentsCount: dto.deploymentsCount || 0,
      issuesResolved: dto.issuesResolved || 0,
      newIssues: dto.newIssues || 0,
    });
  }

  findAll(limit: number = 30): PlatformMetrics[] {
    let metrics = dataStore.platformMetricsFindMany();
    metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return metrics.slice(0, limit);
  }

  getLatest(): PlatformMetrics | null {
    const metrics = dataStore.platformMetricsFindMany();
    if (metrics.length === 0) return null;
    metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return metrics[0];
  }

  getOverall(): {
    averageUptime: number;
    averagePerformance: number;
    averageSecurity: number;
    averageSatisfaction: number;
    averageCostEfficiency: number;
    averageOverallScore: number;
    trends: Record<string, 'up' | 'down' | 'stable'>;
  } {
    const metrics = this.findAll(30);

    if (metrics.length === 0) {
      return {
        averageUptime: 99.9,
        averagePerformance: 85,
        averageSecurity: 90,
        averageSatisfaction: 85,
        averageCostEfficiency: 80,
        averageOverallScore: 88,
        trends: {},
      };
    }

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const averageUptime = avg(metrics.map(m => m.uptime));
    const averagePerformance = avg(metrics.map(m => m.performance));
    const averageSecurity = avg(metrics.map(m => m.security));
    const averageSatisfaction = avg(metrics.map(m => m.userSatisfaction));
    const averageCostEfficiency = avg(metrics.map(m => m.costEfficiency));
    const averageOverallScore = avg(metrics.map(m => m.overallScore));

    // Calculate trends (compare last 7 days to previous 7 days)
    const recent = metrics.slice(0, 7);
    const previous = metrics.slice(7, 14);

    const getTrend = (recentAvg: number, previousAvg: number): 'up' | 'down' | 'stable' => {
      const diff = recentAvg - previousAvg;
      if (diff > 2) return 'up';
      if (diff < -2) return 'down';
      return 'stable';
    };

    return {
      averageUptime: Math.round(averageUptime * 10) / 10,
      averagePerformance: Math.round(averagePerformance * 10) / 10,
      averageSecurity: Math.round(averageSecurity * 10) / 10,
      averageSatisfaction: Math.round(averageSatisfaction * 10) / 10,
      averageCostEfficiency: Math.round(averageCostEfficiency * 10) / 10,
      averageOverallScore: Math.round(averageOverallScore * 10) / 10,
      trends: {
        uptime: getTrend(avg(recent.map(m => m.uptime)), avg(previous.map(m => m.uptime))),
        performance: getTrend(avg(recent.map(m => m.performance)), avg(previous.map(m => m.performance))),
        security: getTrend(avg(recent.map(m => m.security)), avg(previous.map(m => m.security))),
      },
    };
  }

  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const latest = this.getLatest();
    const thresholds = {
      uptime: { warning: 99.5, critical: 99 },
      performance: { warning: 80, critical: 70 },
      security: { warning: 85, critical: 75 },
    };

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!latest) {
      return { status: 'healthy', issues: [], recommendations: [] };
    }

    if (latest.uptime < thresholds.uptime.critical) {
      issues.push('Critical: Uptime below 99%');
      recommendations.push('Investigate system stability issues');
    } else if (latest.uptime < thresholds.uptime.warning) {
      issues.push('Warning: Uptime below 99.5%');
      recommendations.push('Review recent incidents');
    }

    if (latest.performance < thresholds.performance.critical) {
      issues.push('Critical: Performance below 70');
      recommendations.push('Optimize slow queries and endpoints');
    } else if (latest.performance < thresholds.performance.warning) {
      issues.push('Warning: Performance below 80');
      recommendations.push('Review performance bottlenecks');
    }

    if (latest.security < thresholds.security.critical) {
      issues.push('Critical: Security score below 75');
      recommendations.push('Address security vulnerabilities immediately');
    } else if (latest.security < thresholds.security.warning) {
      issues.push('Warning: Security score below 85');
      recommendations.push('Review security improvements');
    }

    const status = issues.some(i => i.startsWith('critical')) ? 'critical' :
                   issues.length > 0 ? 'warning' : 'healthy';

    return { status, issues, recommendations };
  }
}
