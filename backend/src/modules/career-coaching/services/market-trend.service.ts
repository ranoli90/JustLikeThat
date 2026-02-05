import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { MarketTrend } from '../entities/career-coaching.entity';

// Simulated data sources (100+ in production)
const DATA_SOURCES = [
  { name: 'LinkedIn Workforce Report', type: 'employment', reliability: 0.95 },
  { name: 'Bureau of Labor Statistics', type: 'government', reliability: 0.98 },
  { name: 'Glassdoor Insights', type: 'salary', reliability: 0.85 },
  { name: 'Indeed Hiring Index', type: 'job-postings', reliability: 0.88 },
  { name: 'DICE Tech Salaries', type: 'technology', reliability: 0.90 },
  { name: 'Hired.com Report', type: 'hiring', reliability: 0.87 },
];

// Current market trends data
const CURRENT_TRENDS = {
  skills: [
    { name: 'Artificial Intelligence', growth: 0.45, demand: 'very-high', salaryImpact: 0.25 },
    { name: 'Machine Learning', growth: 0.42, demand: 'very-high', salaryImpact: 0.22 },
    { name: 'Cloud Architecture', growth: 0.35, demand: 'high', salaryImpact: 0.18 },
    { name: 'DevOps/DevSecOps', growth: 0.32, demand: 'high', salaryImpact: 0.15 },
    { name: 'Cybersecurity', growth: 0.38, demand: 'very-high', salaryImpact: 0.20 },
    { name: 'Data Engineering', growth: 0.30, demand: 'high', salaryImpact: 0.16 },
    { name: 'React.js', growth: 0.15, demand: 'medium', salaryImpact: 0.08 },
    { name: 'Python', growth: 0.25, demand: 'high', salaryImpact: 0.12 },
    { name: 'TypeScript', growth: 0.28, demand: 'high', salaryImpact: 0.10 },
    { name: 'Kubernetes', growth: 0.35, demand: 'high', salaryImpact: 0.18 },
    { name: 'Blockchain', growth: 0.08, demand: 'low', salaryImpact: 0.05 },
    { name: 'Edge Computing', growth: 0.22, demand: 'medium', salaryImpact: 0.12 },
    { name: 'Quantum Computing', growth: 0.05, demand: 'low', salaryImpact: 0.30 },
    { name: 'AR/VR Development', growth: 0.18, demand: 'medium', salaryImpact: 0.15 },
    { name: 'Natural Language Processing', growth: 0.40, demand: 'very-high', salaryImpact: 0.23 },
  ],
  roles: [
    { name: 'AI/ML Engineer', growth: 0.50, avgSalary: 150000, openings: 50000 },
    { name: 'Cloud Architect', growth: 0.35, avgSalary: 145000, openings: 35000 },
    { name: 'Security Engineer', growth: 0.38, avgSalary: 130000, openings: 40000 },
    { name: 'Data Scientist', growth: 0.25, avgSalary: 125000, openings: 45000 },
    { name: 'DevOps Engineer', growth: 0.30, avgSalary: 120000, openings: 38000 },
    { name: 'Full Stack Developer', growth: 0.12, avgSalary: 110000, openings: 60000 },
    { name: 'Product Manager', growth: 0.15, avgSalary: 120000, openings: 30000 },
    { name: 'UX Designer', growth: 0.10, avgSalary: 95000, openings: 25000 },
    { name: 'Engineering Manager', growth: 0.18, avgSalary: 160000, openings: 15000 },
    { name: 'Solutions Architect', growth: 0.25, avgSalary: 155000, openings: 20000 },
  ],
  industries: [
    { name: 'Technology', growth: 0.20, stability: 0.75 },
    { name: 'Healthcare', growth: 0.15, stability: 0.90 },
    { name: 'Finance', growth: 0.08, stability: 0.85 },
    { name: 'E-commerce', growth: 0.18, stability: 0.70 },
    { name: 'Remote Work', growth: 0.25, stability: 0.80 },
    { name: 'Green Energy', growth: 0.22, stability: 0.75 },
    { name: 'Fintech', growth: 0.28, stability: 0.65 },
    { name: 'EdTech', growth: 0.20, stability: 0.70 },
  ],
  salary: [
    { role: 'Software Engineer', entry: 75000, mid: 120000, senior: 170000, growth: 0.08 },
    { role: 'Data Scientist', entry: 85000, mid: 130000, senior: 180000, growth: 0.10 },
    { role: 'Product Manager', entry: 90000, mid: 140000, senior: 190000, growth: 0.07 },
    { role: 'Designer', entry: 65000, mid: 100000, senior: 140000, growth: 0.05 },
    { role: 'Engineering Manager', entry: 120000, mid: 170000, senior: 220000, growth: 0.06 },
  ],
};

export interface TrendQuery {
  category?: 'skill' | 'role' | 'industry' | 'salary';
  name?: string;
  region?: string;
  timeframe?: '1-month' | '3-month' | '6-month' | '1-year' | '5-year';
}

export interface TrendAlert {
  id: string;
  type: 'demand' | 'salary' | 'skill' | 'role' | 'industry';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  trend: 'rising' | 'stable' | 'declining';
  affectedSkills?: string[];
  recommendations?: string[];
  expiresAt?: Date;
}

@Injectable()
export class MarketTrendService {
  private readonly logger = new Logger(MarketTrendService.name);
  private readonly forecastAccuracy = 0.80;
  private readonly dataSourcesCount = 100;

  constructor(
    @InjectRepository(MarketTrend)
    private readonly trendRepository: Repository<MarketTrend>,
  ) {}

  async getTrends(query: TrendQuery): Promise<any[]> {
    this.logger.log(`Fetching market trends for category: ${query.category}`);

    let trends: any[] = [];

    if (query.category === 'skill' || !query.category) {
      trends = [...trends, ...this.getSkillTrends(query.name)];
    }
    if (query.category === 'role' || !query.category) {
      trends = [...trends, ...this.getRoleTrends(query.name)];
    }
    if (query.category === 'industry' || !query.category) {
      trends = [...trends, ...this.getIndustryTrends(query.name)];
    }
    if (query.category === 'salary' || !query.category) {
      trends = [...trends, ...this.getSalaryTrends()];
    }

    // Filter by name if specified
    if (query.name) {
      trends = trends.filter(t => 
        t.name.toLowerCase().includes(query.name!.toLowerCase())
      );
    }

    // Record trends for historical analysis
    await this.recordTrends(trends, query);

    return trends;
  }

  async createAlert(userId: string, alertType: string, criteria: any): Promise<TrendAlert> {
    this.logger.log(`Creating ${alertType} alert for user ${userId}`);

    const alert: TrendAlert = {
      id: `alert-${Date.now()}`,
      type: alertType as TrendAlert['type'],
      severity: 'info',
      title: this.generateAlertTitle(alertType, criteria),
      description: this.generateAlertDescription(alertType, criteria),
      trend: 'stable',
      recommendations: this.generateRecommendations(alertType, criteria),
    };

    return alert;
  }

  async getTrendByCategoryAndName(category: string, name: string): Promise<any> {
    let trendData: any;

    switch (category) {
      case 'skill':
        trendData = CURRENT_TRENDS.skills.find(s => 
          s.name.toLowerCase() === name.toLowerCase()
        );
        break;
      case 'role':
        trendData = CURRENT_TRENDS.roles.find(r => 
          r.name.toLowerCase() === name.toLowerCase()
        );
        break;
      case 'industry':
        trendData = CURRENT_TRENDS.industries.find(i => 
          i.name.toLowerCase() === name.toLowerCase()
        );
        break;
      case 'salary':
        trendData = CURRENT_TRENDS.salary.find(s => 
          s.role.toLowerCase() === name.toLowerCase()
        );
        break;
    }

    if (trendData) {
      // Generate forecast
      const forecast = this.generateForecast(trendData, category);
      
      // Record the trend
      await this.recordTrend({
        category,
        name,
        data: trendData,
        forecast,
        trend: this.determineTrend(trendData.growth || trendData),
        confidence: this.forecastAccuracy,
      });
    }

    return trendData;
  }

  private getSkillTrends(filter?: string): any[] {
    let skills = CURRENT_TRENDS.skills;

    if (filter) {
      skills = skills.filter(s => 
        s.name.toLowerCase().includes(filter.toLowerCase())
      );
    }

    return skills.map(skill => ({
      category: 'skill',
      name: skill.name,
      data: {
        growth: skill.growth,
        demand: skill.demand,
        salaryImpact: skill.salaryImpact,
      },
      forecast: this.generateForecast(skill, 'skill'),
      trend: skill.growth > 0.2 ? 'rising' : skill.growth > 0.1 ? 'stable' : 'declining',
      confidence: this.forecastAccuracy,
    }));
  }

  private getRoleTrends(filter?: string): any[] {
    let roles = CURRENT_TRENDS.roles;

    if (filter) {
      roles = roles.filter(r => 
        r.name.toLowerCase().includes(filter.toLowerCase())
      );
    }

    return roles.map(role => ({
      category: 'role',
      name: role.name,
      data: {
        growth: role.growth,
        avgSalary: role.avgSalary,
        openings: role.openings,
      },
      forecast: this.generateForecast(role, 'role'),
      trend: role.growth > 0.2 ? 'rising' : role.growth > 0.1 ? 'stable' : 'declining',
      confidence: this.forecastAccuracy,
    }));
  }

  private getIndustryTrends(filter?: string): any[] {
    let industries = CURRENT_TRENDS.industries;

    if (filter) {
      industries = industries.filter(i => 
        i.name.toLowerCase().includes(filter.toLowerCase())
      );
    }

    return industries.map(industry => ({
      category: 'industry',
      name: industry.name,
      data: {
        growth: industry.growth,
        stability: industry.stability,
      },
      forecast: this.generateForecast(industry, 'industry'),
      trend: industry.growth > 0.15 ? 'rising' : industry.growth > 0.05 ? 'stable' : 'declining',
      confidence: this.forecastAccuracy,
    }));
  }

  private getSalaryTrends(): any[] {
    return CURRENT_TRENDS.salary.map(salary => ({
      category: 'salary',
      name: salary.role,
      data: {
        entry: salary.entry,
        mid: salary.mid,
        senior: salary.senior,
        growth: salary.growth,
      },
      forecast: this.generateForecast(salary, 'salary'),
      trend: salary.growth > 0.08 ? 'rising' : salary.growth > 0.03 ? 'stable' : 'declining',
      confidence: this.forecastAccuracy,
    }));
  }

  private generateForecast(data: any, category: string): any[] {
    const forecast: any[] = [];
    const years = 5;

    for (let year = 1; year <= years; year++) {
      const forecastData: any = { year };

      if (category === 'skill') {
        forecastData.value = (data.growth || 0) * (1 + 0.05 * year);
        forecastData.demand = data.demand;
      } else if (category === 'role') {
        forecastData.openings = Math.round((data.openings || 0) * (1 + (data.growth || 0) * year));
        forecastData.salary = Math.round((data.avgSalary || 0) * (1 + 0.03 * year));
      } else if (category === 'industry') {
        forecastData.growth = (data.growth || 0) * (1 - 0.1 * year);
        forecastData.stability = Math.max(0.5, (data.stability || 0.8) - 0.05 * year);
      } else if (category === 'salary') {
        forecastData.entry = Math.round((data.entry || 0) * Math.pow(1 + (data.growth || 0.05), year));
        forecastData.mid = Math.round((data.mid || 0) * Math.pow(1 + (data.growth || 0.05), year));
        forecastData.senior = Math.round((data.senior || 0) * Math.pow(1 + (data.growth || 0.05), year));
      }

      forecast.push(forecastData);
    }

    return forecast;
  }

  private determineTrend(growth: number | any): string {
    if (typeof growth === 'object' && growth !== null) {
      growth = growth.growth || growth.value || 0;
    }
    return growth > 0.2 ? 'rising' : growth > 0.05 ? 'stable' : 'declining';
  }

  private async recordTrend(trend: { category: string; name: string; data: any; forecast: any; trend: string; confidence: number }): Promise<void> {
    const marketTrend = this.trendRepository.create({
      category: trend.category,
      name: trend.name,
      data: trend.data,
      forecast: trend.forecast,
      trend: trend.trend,
      confidence: trend.confidence,
    });

    await this.trendRepository.save(marketTrend);
  }

  private async recordTrends(trends: any[], query: TrendQuery): Promise<void> {
    for (const trend of trends.slice(0, 10)) {
      await this.recordTrend({
        ...trend,
        confidence: this.forecastAccuracy,
      });
    }
  }

  private generateAlertTitle(alertType: string, criteria: any): string {
    const titles: Record<string, string> = {
      demand: `High Demand Alert: ${criteria.skill || criteria.role || 'Skill'}`,
      salary: `Salary Update: ${criteria.role || 'Position'}`,
      skill: `Skill Trend: ${criteria.skill}`,
      role: `Role Opportunity: ${criteria.role}`,
      industry: `Industry Insight: ${criteria.industry}`,
    };

    return titles[alertType] || 'Market Trend Alert';
  }

  private generateAlertDescription(alertType: string, criteria: any): string {
    const descriptions: Record<string, string> = {
      demand: `The demand for ${criteria.skill || criteria.role} has increased significantly in the past quarter.`,
      salary: `Salary ranges for ${criteria.role} positions have shown positive growth trends.`,
      skill: `${criteria.skill} is showing strong growth trajectory with increasing employer demand.`,
      role: `${criteria.role} positions are in high demand with competitive compensation packages.`,
      industry: `The ${criteria.industry} sector is experiencing notable changes in hiring trends.`,
    };

    return descriptions[alertType] || 'A market trend update that may affect your career planning.';
  }

  private generateRecommendations(alertType: string, criteria: any): string[] {
    const recommendations: Record<string, string[]> = {
      demand: [
        `Consider upskilling in ${criteria.skill || criteria.role} to capitalize on demand`,
        'Update your resume to highlight relevant skills',
        'Set up job alerts for this skill/role',
      ],
      salary: [
        'Research current market rates for your experience level',
        'Prepare salary negotiation strategies',
        'Document your achievements for compensation discussions',
      ],
      skill: [
        `Explore training resources for ${criteria.skill}`,
        'Add this skill to your professional development plan',
        'Seek projects that utilize this skill',
      ],
      role: [
        'Review job descriptions to understand required qualifications',
        'Network with professionals in this role',
        'Consider informational interviews',
      ],
      industry: [
        'Research companies in growing industries',
        'Identify transferable skills for industry transitions',
        'Attend industry-specific events and conferences',
      ],
    };

    return recommendations[alertType] || ['Stay updated with market trends'];
  }
}
