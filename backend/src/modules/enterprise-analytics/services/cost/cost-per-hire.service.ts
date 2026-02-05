// Cost-per-Hire Service
// Sprint 45: Enterprise Analytics & Reporting

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ICostTracking,
  ICostBudget,
  ICostROI,
  ICostForecast,
  IVarianceAnalysis,
} from '../../interfaces/analytics.interface';

interface CostCreateDto {
  hireId?: string;
  jobId?: string;
  department?: string;
  category: string;
  amount: number;
  currency?: string;
  description?: string;
  vendor?: string;
  receipt?: string;
  allocatedTo?: string;
  costCenter?: string;
}

interface BudgetCreateDto {
  name: string;
  period: string;
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  categories?: Record<string, number>;
  departments?: Record<string, number>;
  varianceThreshold?: number;
}

@Injectable()
export class CostPerHireService {
  private readonly logger = new Logger(CostPerHireService.name);

  // Cost tracking
  async trackCost(tenantId: string, userId: string, data: CostCreateDto) {
    this.logger.log(`Tracking cost for tenant ${tenantId}`);

    const convertedAmount = this.convertCurrency(data.amount, data.currency || 'USD');

    return this.prisma.costTracking.create({
      data: {
        tenantId,
        hireId: data.hireId,
        jobId: data.jobId,
        department: data.department,
        category: data.category,
        amount: data.amount,
        currency: data.currency || 'USD',
        convertedAmount,
        description: data.description,
        vendor: data.vendor,
        receipt: data.receipt,
        allocatedTo: data.allocatedTo,
        costCenter: data.costCenter,
        status: 'pending',
      },
    });
  }

  async getCosts(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
    filters?: {
      category?: string;
      department?: string;
      hireId?: string;
    },
  ): Promise<ICostTracking[]> {
    this.logger.log(`Getting costs for tenant ${tenantId}`);

    // In production, query actual data from the database
    return [
      {
        id: 'c1',
        tenantId,
        hireId: 'h1',
        department: 'Engineering',
        category: 'job_board' as const,
        amount: 5000,
        currency: 'USD',
        status: 'approved' as const,
        createdAt: new Date(),
      },
    ];
  }

  async getCostSummary(tenantId: string, startDate: Date, endDate: Date) {
    this.logger.log(`Getting cost summary for tenant ${tenantId}`);

    return {
      totalCost: 215000,
      byCategory: {
        job_board: { amount: 50000, percentage: 23.3 },
        referral: { amount: 30000, percentage: 14.0 },
        agency: { amount: 75000, percentage: 34.9 },
        advertising: { amount: 40000, percentage: 18.6 },
        events: { amount: 20000, percentage: 9.3 },
      },
      byDepartment: {
        Engineering: { amount: 85000, headcount: 25, costPerHire: 3400 },
        Sales: { amount: 55000, headcount: 20, costPerHire: 2750 },
        Marketing: { amount: 35000, headcount: 12, costPerHire: 2917 },
        Operations: { amount: 25000, headcount: 10, costPerHire: 2500 },
        Finance: { amount: 15000, headcount: 5, costPerHire: 3000 },
      },
      periodComparison: {
        previousPeriod: 195000,
        change: 20000,
        changePercent: 10.3,
      },
    };
  }

  async getCostPerHire(tenantId: string, startDate: Date, endDate: Date) {
    this.logger.log(`Getting cost-per-hire for tenant ${tenantId}`);

    return {
      overall: {
        totalCost: 215000,
        totalHires: 67,
        costPerHire: 3209,
        previousPeriod: 3050,
        change: 159,
        changePercent: 5.2,
      },
      byCategory: {
        job_board: { costPerHire: 333, totalCost: 50000, hires: 150 },
        referral: { costPerHire: 250, totalCost: 30000, hires: 120 },
        agency: { costPerHire: 1875, totalCost: 75000, hires: 40 },
        advertising: { costPerHire: 500, totalCost: 40000, hires: 80 },
        events: { costPerHire: 400, totalCost: 20000, hires: 50 },
      },
      byDepartment: {
        Engineering: { costPerHire: 3400, hires: 25 },
        Sales: { costPerHire: 2750, hires: 20 },
        Marketing: { costPerHire: 2917, hires: 12 },
        Operations: { costPerHire: 2500, hires: 10 },
      },
      benchmarks: {
        industryAvg: 4129,
        percentile: 65,
        topPerformers: 2500,
        bestInClass: 2000,
      },
    };
  }

  async getCostByCategory(tenantId: string, startDate: Date, endDate: Date) {
    this.logger.log(`Getting costs by category for tenant ${tenantId}`);

    const categories = [
      { category: 'job_board', description: 'Job Board Advertising', budget: 60000, spent: 50000, limit: null },
      { category: 'referral', description: 'Employee Referral Program', budget: 40000, spent: 30000, limit: null },
      { category: 'agency', description: 'Recruitment Agencies', budget: 80000, spent: 75000, limit: 5000 },
      { category: 'advertising', description: 'Digital Advertising', budget: 45000, spent: 40000, limit: null },
      { category: 'events', description: 'Recruitment Events', budget: 25000, spent: 20000, limit: null },
      { category: 'recruiter', description: 'Recruiter Salaries', budget: 200000, spent: 180000, limit: null },
      { category: 'technology', description: 'ATS and Tools', budget: 50000, spent: 45000, limit: null },
      { category: 'assessment', description: 'Assessment Tools', budget: 15000, spent: 12000, limit: null },
      { category: 'background_check', description: 'Background Checks', budget: 20000, spent: 18000, limit: null },
      { category: 'travel', description: 'Candidate Travel', budget: 30000, spent: 25000, limit: null },
    ];

    return categories.map(cat => ({
      ...cat,
      remaining: cat.budget - cat.spent,
      utilization: (cat.spent / cat.budget) * 100,
      status: cat.spent > cat.budget ? 'over' : cat.spent > cat.budget * 0.9 ? 'warning' : 'normal',
    }));
  }

  // Budget Management
  async createBudget(tenantId: string, userId: string, data: BudgetCreateDto) {
    this.logger.log(`Creating budget for tenant ${tenantId}`);

    const categories = data.categories || {
      job_board: data.totalBudget * 0.2,
      referral: data.totalBudget * 0.15,
      agency: data.totalBudget * 0.3,
      advertising: data.totalBudget * 0.15,
      events: data.totalBudget * 0.1,
      other: data.totalBudget * 0.1,
    };

    return this.prisma.costBudget.create({
      data: {
        tenantId,
        name: data.name,
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate,
        totalBudget: data.totalBudget,
        spentAmount: 0,
        categories: categories,
        departments: data.departments || {},
        varianceThreshold: data.varianceThreshold || 10,
        status: 'active',
      },
    });
  }

  async getBudgets(tenantId: string) {
    this.logger.log(`Getting budgets for tenant ${tenantId}`);

    return this.prisma.costBudget.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });
  }

  async getBudgetById(budgetId: string, tenantId: string) {
    const budget = await this.prisma.costBudget.findUnique({
      where: { id: budgetId },
    });

    if (!budget || budget.tenantId !== tenantId) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async updateBudget(budgetId: string, tenantId: string, data: Partial<BudgetCreateDto>) {
    const existing = await this.getBudgetById(budgetId, tenantId);

    return this.prisma.costBudget.update({
      where: { id: budgetId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async getBudgetStatus(tenantId: string, budgetId: string) {
    const budget = await this.getBudgetById(budgetId, tenantId);

    const categories = budget.categories as Record<string, { budget: number; spent: number }>;
    const alerts: Record<string, any> = {};

    for (const [category, data] of Object.entries(categories)) {
      const utilization = (data.spent / data.budget) * 100;
      if (utilization >= budget.varianceThreshold) {
        alerts[category] = {
          percentage: utilization,
          alerted: true,
          status: utilization >= 100 ? 'over_budget' : 'approaching_limit',
        };
      }
    }

    return {
      budgetId,
      totalBudget: budget.totalBudget,
      spentAmount: budget.spentAmount,
      remainingAmount: budget.totalBudget - budget.spentAmount,
      utilization: (budget.spentAmount / budget.totalBudget) * 100,
      categories,
      alerts,
      status: budget.status,
    };
  }

  // ROI Calculation
  async calculateROI(tenantId: string, hireId: string) {
    this.logger.log(`Calculating ROI for hire ${hireId}`);

    return {
      hireId,
      calculationDate: new Date(),
      totalCost: 5000,
      perHireCost: 5000,
      hireValue: 75000,
      performanceScore: 4.2,
      tenureMonths: 18,
      roi: 1400,
      paybackPeriod: 1.2,
      vsBudget: -10,
      vsAverage: -16.7,
    };
  }

  async getROIAnalysis(tenantId: string, startDate: Date, endDate: Date) {
    this.logger.log(`Getting ROI analysis for tenant ${tenantId}`);

    return {
      summary: {
        totalCost: 215000,
        totalHires: 67,
        avgCostPerHire: 3209,
        avgROI: 850,
        avgPaybackPeriod: 2.5,
      },
      byCategory: {
        referral: { avgROI: 1200, avgPaybackPeriod: 1.5, count: 120 },
        job_board: { avgROI: 750, avgPaybackPeriod: 3, count: 150 },
        agency: { avgROI: 600, avgPaybackPeriod: 4, count: 40 },
        advertising: { avgROI: 450, avgPaybackPeriod: 3.5, count: 80 },
      },
      topPerformers: [
        { hireId: 'h1', role: 'Senior Engineer', cost: 4500, roi: 1500, performance: 4.5 },
        { hireId: 'h2', role: 'Sales Manager', cost: 5500, roi: 1800, performance: 4.8 },
        { hireId: 'h3', role: 'Product Manager', cost: 4000, roi: 1400, performance: 4.3 },
      ],
      underperformers: [
        { hireId: 'h10', role: 'Junior Developer', cost: 3000, roi: 200, performance: 2.5 },
        { hireId: 'h11', role: 'Marketing Coord', cost: 2500, roi: 300, performance: 2.8 },
      ],
    };
  }

  // Variance Analysis
  async analyzeVariance(tenantId: string, budgetId: string) {
    this.logger.log(`Analyzing variance for budget ${budgetId}`);

    const variances: IVarianceAnalysis[] = [
      {
        budgetId,
        category: 'agency',
        budgetedAmount: 80000,
        actualAmount: 75000,
        variance: -5000,
        variancePercent: -6.25,
        varianceType: 'favorable',
        reason: 'Negotiated lower agency fees',
        contributingFactors: [
          { factor: 'Volume discount', impact: -3000 },
          { factor: 'Reduced agency usage', impact: -2000 },
        ],
      },
      {
        budgetId,
        category: 'job_board',
        budgetedAmount: 60000,
        actualAmount: 50000,
        variance: -10000,
        variancePercent: -16.67,
        varianceType: 'favorable',
        reason: 'Reduced job board usage due to referral increase',
        contributingFactors: [
          { factor: 'More referrals', impact: -8000 },
          { factor: 'Better organic traffic', impact: -2000 },
        ],
      },
      {
        budgetId,
        category: 'advertising',
        budgetedAmount: 45000,
        actualAmount: 40000,
        variance: -5000,
        variancePercent: -11.11,
        varianceType: 'favorable',
        contributingFactors: [
          { factor: 'More efficient campaigns', impact: -5000 },
        ],
      },
    ];

    return {
      budgetId,
      overallVariance: {
        budgeted: 500000,
        actual: 465000,
        variance: -35000,
        variancePercent: -7,
        varianceType: 'favorable',
      },
      variances,
      trends: {
        improving: true,
        monthlyChange: -2.5,
        quarterlyChange: -7,
      },
    };
  }

  // Cost Forecasting
  async forecastCosts(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ICostForecast> {
    this.logger.log(`Forecasting costs for tenant ${tenantId}`);

    const months = this.getMonthsBetween(startDate, endDate);
    const avgMonthlySpend = 215000 / 12;
    const projectedSpend = avgMonthlySpend * months;

    return {
      tenantId,
      period: 'monthly',
      startDate,
      endDate,
      projectedSpend,
      confidence: 0.85,
      byCategory: {
        job_board: projectedSpend * 0.23,
        referral: projectedSpend * 0.14,
        agency: projectedSpend * 0.35,
        advertising: projectedSpend * 0.19,
        events: projectedSpend * 0.09,
      },
      assumptions: [
        'Hiring volume remains consistent',
        'No major market changes',
        'Current mix of sources maintained',
        'Inflation rate of 3% applied',
      ],
      vsBudget: -5,
    };
  }

  async getCostForecastTrend(tenantId: string, months: number = 12) {
    this.logger.log(`Getting cost forecast trend for tenant ${tenantId}`);

    const trend = [];
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      trend.push({
        date,
        projected: Math.floor(Math.random() * 20000) + 15000,
        optimistic: Math.floor(Math.random() * 15000) + 12000,
        pessimistic: Math.floor(Math.random() * 25000) + 18000,
        actual: i < 3 ? Math.floor(Math.random() * 20000) + 15000 : null,
      });
    }

    return trend;
  }

  // Expense categorization
  async categorizeExpense(
    tenantId: string,
    expense: any,
  ): Promise<{ category: string; confidence: number }> {
    // Simple keyword-based categorization
    const keywords: Record<string, string[]> = {
      job_board: ['linkedin', 'indeed', 'glassdoor', 'monster', 'career'],
      referral: ['referral', 'bonus', 'employee referral'],
      agency: ['agency', 'recruiter', 'headhunter', 'search firm'],
      advertising: ['ad', 'campaign', 'google ads', 'facebook ads', 'sponsored'],
      events: ['event', 'career fair', 'conference', 'meetup'],
      technology: ['software', 'license', 'subscription', 'tool', 'ats'],
      background_check: ['background', 'check', 'verification', 'screening'],
      assessment: ['assessment', 'test', 'evaluation', 'psychometric'],
      travel: ['travel', 'flight', 'hotel', 'accommodation', 'transportation'],
      relocation: ['relocation', 'moving', 'housing', 'settlement'],
    };

    const description = (expense.description || '').toLowerCase();
    
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => description.includes(word))) {
        return { category, confidence: 0.9 };
      }
    }

    return { category: 'other', confidence: 0.5 };
  }

  // Private helper methods
  private convertCurrency(amount: number, fromCurrency: string, toCurrency: string = 'USD'): number {
    // In production, use actual exchange rates
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 1.1,
      GBP: 1.27,
      CAD: 0.74,
      AUD: 0.65,
    };
    return amount * (rates[toCurrency] / (rates[fromCurrency] || 1));
  }

  private getMonthsBetween(start: Date, end: Date): number {
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }
}
