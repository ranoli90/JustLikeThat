import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreferences } from '../../entities/user-preferences.entity';
import { JobPosting } from '../../entities/job-posting.entity';

export interface CulturalFitScore {
  overallScore: number;
  workStyle: number;
  values: number;
  communication: number;
  growth: number;
  details: CulturalFitDetails;
}

export interface CulturalFitDetails {
  matchedValues: string[];
  mismatchedValues: string[];
  workStyleAlignment: string;
  growthOpportunities: string[];
  riskFactors: string[];
  positiveSignals: string[];
}

export interface CulturalDimension {
  name: string;
  keywords: string[];
  positiveIndicators: string[];
  negativeIndicators: string[];
}

@Injectable()
export class CulturalFitService {
  private readonly logger = new Logger(CulturalFitService.name);

  // Cultural dimensions for matching
  private readonly CULTURAL_DIMENSIONS: CulturalDimension[] = [
    {
      name: 'Innovation',
      keywords: ['innovative', 'cutting-edge', 'disrupt', 'experiment', 'iterate', 'agile'],
      positiveIndicators: ['innovation', 'experimentation', 'new technologies', 'continuous improvement'],
      negativeIndicators: ['status quo', 'traditional', 'legacy', 'resistant to change'],
    },
    {
      name: 'Collaboration',
      keywords: ['team', 'collaborative', 'cross-functional', 'pair programming', 'peer review'],
      positiveIndicators: ['team player', 'collaborative environment', 'open communication', 'knowledge sharing'],
      negativeIndicators: ['silo', 'independent work', 'minimal interaction', 'isolated'],
    },
    {
      name: 'Work-Life Balance',
      keywords: ['flexible', 'remote', 'balance', 'wellness', ' PTO ', 'unlimited vacation'],
      positiveIndicators: ['flexible hours', 'remote-friendly', 'work-life balance', 'unlimited PTO'],
      negativeIndicators: ['long hours', '24/7 availability', 'high pressure', 'burnout culture'],
    },
    {
      name: 'Transparency',
      keywords: ['transparent', 'open', 'honest', 'candor', 'feedback', 'open-door'],
      positiveIndicators: ['transparent communication', 'open feedback', 'clear goals', 'honest dialogue'],
      negativeIndicators: ['secretive', 'lack of communication', 'hidden agendas', 'micromanagement'],
    },
    {
      name: 'Autonomy',
      keywords: ['autonomous', 'ownership', 'accountable', 'independent', 'self-directed'],
      positiveIndicators: ['autonomous work', 'ownership mentality', 'empowered teams', 'trust'],
      negativeIndicators: ['micromanagement', 'tight control', 'rigid processes', 'limited autonomy'],
    },
    {
      name: 'Growth Mindset',
      keywords: ['learning', 'development', 'growth', 'mentorship', 'training', 'career path'],
      positiveIndicators: ['learning opportunities', 'professional development', 'career growth', 'mentorship'],
      negativeIndicators: ['stagnation', 'limited growth', 'no development', 'flat structure'],
    },
    {
      name: 'Results-Oriented',
      keywords: ['results', 'impact', 'metrics', 'KPIs', 'performance', 'output'],
      positiveIndicators: ['results-driven', 'impact-focused', 'performance-based', 'metric-oriented'],
      negativeIndicators: ['process-heavy', 'face-time', 'activity over results', 'output not valued'],
    },
    {
      name: 'Customer Focus',
      keywords: ['customer', 'user', 'client', 'user-centric', 'customer-obsessed'],
      positiveIndicators: ['customer-first', 'user-centric', 'client success', 'customer obsession'],
      negativeIndicators: ['internal focus', 'product-driven', 'engineering-led', 'feature factories'],
    },
  ];

  constructor(
    @InjectRepository(UserPreferences)
    private readonly userPreferencesRepository: Repository<UserPreferences>,
    @InjectRepository(JobPosting)
    private readonly jobPostingRepository: Repository<JobPosting>,
  ) {}

  /**
   * Assess cultural fit between user preferences and job posting
   */
  async assessCulturalFit(
    userPreferences: UserPreferences,
    jobPosting: JobPosting,
  ): Promise<CulturalFitScore> {
    const jobDescription = jobPosting.description.toLowerCase();
    const jobRequirements = JSON.stringify(jobPosting.requirements).toLowerCase();
    const jobContent = `${jobDescription} ${jobRequirements}`;

    // Extract user's cultural preferences from available fields
    const preferredValues = this.extractUserValues(userPreferences);
    const preferredWorkStyle = userPreferences.remotePreference || 'flexible';

    // Score each dimension
    const dimensionScores: Record<string, number> = {};
    const matchedValues: string[] = [];
    const mismatchedValues: string[] = [];
    const positiveSignals: string[] = [];
    const riskFactors: string[] = [];

    for (const dimension of this.CULTURAL_DIMENSIONS) {
      const score = this.scoreDimension(jobContent, dimension);
      dimensionScores[dimension.name] = score;

      // Track matched/mismatched values
      if (score >= 0.7 && preferredValues.includes(dimension.name)) {
        matchedValues.push(dimension.name);
        positiveSignals.push(this.generatePositiveSignal(dimension.name, jobContent));
      } else if (score < 0.4 && preferredValues.includes(dimension.name)) {
        mismatchedValues.push(dimension.name);
        riskFactors.push(this.generateRiskFactor(dimension.name));
      }
    }

    // Calculate overall scores
    const workStyleScore = this.calculateWorkStyleScore(preferredWorkStyle, jobContent);
    const valuesScore = this.calculateValuesScore(matchedValues, mismatchedValues, preferredValues.length);
    const communicationScore = dimensionScores['Transparency'] || 0.5;
    const growthScore = dimensionScores['Growth Mindset'] || 0.5;

    const overallScore = (
      (dimensionScores['Innovation'] || 0.5) * 0.15 +
      (dimensionScores['Collaboration'] || 0.5) * 0.15 +
      (dimensionScores['Work-Life Balance'] || 0.5) * 0.15 +
      (dimensionScores['Transparency'] || 0.5) * 0.1 +
      (dimensionScores['Autonomy'] || 0.5) * 0.15 +
      (dimensionScores['Growth Mindset'] || 0.5) * 0.15 +
      (dimensionScores['Results-Oriented'] || 0.5) * 0.1 +
      (dimensionScores['Customer Focus'] || 0.5) * 0.05
    );

    // Generate details
    const details: CulturalFitDetails = {
      matchedValues,
      mismatchedValues,
      workStyleAlignment: this.generateWorkStyleDescription(workStyleScore, preferredWorkStyle),
      growthOpportunities: this.identifyGrowthOpportunities(dimensionScores),
      riskFactors,
      positiveSignals: positiveSignals.slice(0, 5),
    };

    return {
      overallScore,
      workStyle: workStyleScore,
      values: valuesScore,
      communication: communicationScore,
      growth: growthScore,
      details,
    };
  }

  /**
   * Extract user's cultural values from preferences
   * Uses available fields to infer cultural preferences
   */
  private extractUserValues(preferences: UserPreferences): string[] {
    const values: string[] = [];

    // Infer values from available preferences
    if (preferences.remotePreference === 'remote') {
      values.push('Work-Life Balance');
      values.push('Autonomy');
    }

    if (preferences.skillKeywords && preferences.skillKeywords.length > 0) {
      // If keywords suggest innovation/tech stack, infer growth mindset
      const keywords = preferences.skillKeywords.join(' ').toLowerCase();
      if (keywords.includes('python') || keywords.includes('javascript') || 
          keywords.includes('react') || keywords.includes('ai') || 
          keywords.includes('machine learning')) {
        values.push('Innovation');
        values.push('Growth Mindset');
      }
    }

    // Default preferences for job seekers
    values.push('Collaboration');
    values.push('Growth Mindset');

    return [...new Set(values)];
  }

  /**
   * Extract work style preference from user preferences
   */
  private extractWorkStylePreference(preferences: UserPreferences): string {
    return preferences.remotePreference || 'flexible';
  }

  /**
   * Score a cultural dimension based on job content
   */
  private scoreDimension(jobContent: string, dimension: CulturalDimension): number {
    let positiveMatches = 0;
    let negativeMatches = 0;

    // Check for positive indicators
    for (const indicator of dimension.positiveIndicators) {
      if (jobContent.includes(indicator.toLowerCase())) {
        positiveMatches += 1;
      }
    }

    // Check for negative indicators
    for (const indicator of dimension.negativeIndicators) {
      if (jobContent.includes(indicator.toLowerCase())) {
        negativeMatches += 1;
      }
    }

    // Calculate score with diminishing returns
    const totalIndicators = dimension.positiveIndicators.length + dimension.negativeIndicators.length;
    const score = (positiveMatches - negativeMatches * 0.5) / (dimension.positiveIndicators.length * 0.5);

    return Math.max(0, Math.min(1, 0.5 + score * 0.1));
  }

  /**
   * Calculate work style compatibility score
   */
  private calculateWorkStyleScore(preferredStyle: string, jobContent: string): number {
    const remoteKeywords = ['remote', 'work from home', 'wfh', 'anywhere', 'distributed'];
    const onsiteKeywords = ['onsite', 'in-office', 'hybrid', 'office-based'];
    const flexibleKeywords = ['flexible', 'flex hours', 'flexible hours', 'hybrid'];

    let score = 0.5;

    const content = jobContent.toLowerCase();
    const remoteCount = remoteKeywords.filter(kw => content.includes(kw)).length;
    const onsiteCount = onsiteKeywords.filter(kw => content.includes(kw)).length;

    if (preferredStyle === 'remote' || preferredStyle === 'REMOTE') {
      if (remoteCount > 0) score = 1;
      else if (onsiteCount > 0) score = 0.2;
      else if (flexibleKeywords.some(kw => content.includes(kw))) score = 0.7;
    } else if (preferredStyle === 'onsite' || preferredStyle === 'ONSITE') {
      if (onsiteCount > 0) score = 1;
      else if (remoteCount > 0) score = 0.2;
    } else {
      // Flexible
      if (remoteCount > 0 || onsiteCount > 0 || flexibleKeywords.some(kw => content.includes(kw))) {
        score = 0.9;
      }
    }

    return score;
  }

  /**
   * Calculate values alignment score
   */
  private calculateValuesScore(
    matchedValues: string[],
    mismatchedValues: string[],
    totalPreferences: number,
  ): number {
    if (totalPreferences === 0) return 0.5;

    const matchBonus = matchedValues.length * 0.15;
    const mismatchPenalty = mismatchedValues.length * 0.2;

    return Math.max(0, Math.min(1, matchBonus - mismatchPenalty + 0.5));
  }

  /**
   * Generate positive signal description
   */
  private generatePositiveSignal(dimension: string, jobContent: string): string {
    const signals: Record<string, string> = {
      'Innovation': 'The company embraces innovation and experimentation',
      'Collaboration': 'Strong emphasis on teamwork and cross-functional collaboration',
      'Work-Life Balance': 'Company values work-life integration and employee wellness',
      'Transparency': 'Open communication and transparent decision-making culture',
      'Autonomy': 'Empowers employees with ownership and independence',
      'Growth Mindset': 'Committed to employee development and career growth',
      'Results-Oriented': 'Focuses on outcomes and impact over activity',
      'Customer Focus': 'Customer-centric approach drives decision making',
    };

    return signals[dimension] || `Strong alignment on ${dimension}`;
  }

  /**
   * Generate risk factor description
   */
  private generateRiskFactor(dimension: string): string {
    const risks: Record<string, string> = {
      'Innovation': 'May have limited appetite for innovation',
      'Collaboration': 'Could be a siloed or independent work environment',
      'Work-Life Balance': 'Potential for work-life balance challenges',
      'Transparency': 'May lack transparent communication practices',
      'Autonomy': 'May have limited autonomy in role',
      'Growth Mindset': 'Limited professional development opportunities',
      'Results-Oriented': 'May prioritize activity over outcomes',
      'Customer Focus': 'May not be customer-centric',
    };

    return risks[dimension] || `Potential mismatch on ${dimension}`;
  }

  /**
   * Generate work style alignment description
   */
  private generateWorkStyleDescription(score: number, preference: string): string {
    if (score >= 0.8) {
      return `Excellent alignment with your ${preference} work style preference`;
    } else if (score >= 0.6) {
      return `Good alignment with your ${preference} work style preference`;
    } else if (score >= 0.4) {
      return `Moderate alignment with your ${preference} work style preference`;
    } else {
      return `Potential mismatch with your ${preference} work style preference`;
    }
  }

  /**
   * Identify growth opportunities based on dimension scores
   */
  private identifyGrowthOpportunities(dimensionScores: Record<string, number>): string[] {
    const opportunities: string[] = [];

    if (dimensionScores['Growth Mindset'] < 0.5) {
      opportunities.push('Consider discussing growth opportunities during interview');
    }
    if (dimensionScores['Innovation'] < 0.5) {
      opportunities.push('May have limited opportunities for innovation');
    }
    if (dimensionScores['Autonomy'] < 0.5) {
      opportunities.push('Role may have limited autonomy - clarify during interview');
    }
    if (dimensionScores['Work-Life Balance'] < 0.5) {
      opportunities.push('Ask about typical work hours and team culture');
    }

    return opportunities;
  }

  /**
   * Get list of all cultural dimensions
   */
  getCulturalDimensions(): string[] {
    return this.CULTURAL_DIMENSIONS.map(d => d.name);
  }

  /**
   * Analyze company culture from job posting
   */
  async analyzeCompanyCulture(jobPosting: JobPosting): Promise<{
    primaryCulture: string;
    secondaryCultures: string[];
    tone: string;
    recommendations: string[];
  }> {
    const jobContent = `${jobPosting.description} ${JSON.stringify(jobPosting.requirements)}`.toLowerCase();

    // Score all dimensions
    const scores = this.CULTURAL_DIMENSIONS.map(dimension => ({
      name: dimension.name,
      score: this.scoreDimension(jobContent, dimension),
    }));

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    return {
      primaryCulture: scores[0]?.name || 'Unknown',
      secondaryCultures: scores.slice(1, 3).map(s => s.name),
      tone: this.determineTone(jobContent),
      recommendations: this.generateRecommendations(scores),
    };
  }

  /**
   * Determine company tone from job posting
   */
  private determineTone(content: string): string {
    const formalIndicators = ['professional', 'enterprise', 'corporate', 'structured'];
    const startupIndicators = ['startup', 'fast-paced', 'dynamic', 'scrappy', 'growth-stage'];
    const enterpriseIndicators = ['global', 'scale', 'millions of users', ' Fortune '];

    const formalCount = formalIndicators.filter(i => content.includes(i)).length;
    const startupCount = startupIndicators.filter(i => content.includes(i)).length;
    const enterpriseCount = enterpriseIndicators.filter(i => content.includes(i)).length;

    if (startupCount > formalCount && startupCount > enterpriseCount) {
      return 'Startup-like';
    } else if (enterpriseCount > formalCount && enterpriseCount > startupCount) {
      return 'Enterprise';
    } else if (formalCount > startupCount && formalCount > enterpriseCount) {
      return 'Corporate';
    }
    return 'Balanced';
  }

  /**
   * Generate recommendations based on cultural analysis
   */
  private generateRecommendations(scores: { name: string; score: number }[]): string[] {
    const recommendations: string[] = [];

    const lowest = scores[scores.length - 1];
    if (lowest && lowest.score < 0.4) {
      recommendations.push(`Clarify expectations around ${lowest.name} during the interview process`);
    }

    recommendations.push('Review company reviews on platforms like Glassdoor for employee experiences');
    recommendations.push('Ask about team dynamics and day-to-day work during interviews');

    return recommendations;
  }
}
