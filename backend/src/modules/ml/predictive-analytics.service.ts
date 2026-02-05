import { Injectable, Logger } from '@nestjs/common';
import { MLInfrastructureService } from './ml-infrastructure.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * DTO for application success prediction input
 */
export interface ApplicationSuccessInput {
  candidateId: string;
  jobId: string;
  applicationData?: {
    resumeScore?: number;
    coverLetterQuality?: number;
    responseCompleteness?: number;
    applicationTiming?: number;
  };
}

/**
 * DTO for time-to-hire estimation input
 */
export interface TimeToHireInput {
  jobId: string;
  candidateId: string;
  marketConditions?: {
    unemploymentRate?: number;
    industryGrowth?: number;
    competitionLevel?: number;
  };
}

/**
 * DTO for career trajectory prediction input
 */
export interface CareerTrajectoryInput {
  candidateId: string;
  currentRole: string;
  currentIndustry: string;
  yearsOfExperience: number;
  skills: string[];
  educationLevel: string;
  goals?: string[];
}

/**
 * DTO for prediction result
 */
export interface PredictionResult {
  prediction: number;
  confidence: number;
  factors: PredictionFactor[];
  modelVersion: string;
  recommendations?: string[];
}

/**
 * Prediction factor
 */
export interface PredictionFactor {
  name: string;
  value: number;
  impact: number;
  description: string;
}

/**
 * Predictive Analytics Pipeline Service
 * Implements application success prediction, time-to-hire estimation, and career trajectory prediction
 */
@Injectable()
export class PredictiveAnalyticsService {
  private readonly logger = new Logger(PredictiveAnalyticsService.name);
  
  // Industry growth rates (annual %)
  private readonly industryGrowthRates: Record<string, number> = {
    technology: 5.5,
    healthcare: 4.2,
    finance: 3.1,
    manufacturing: 1.5,
    retail: 2.0,
    education: 2.5,
    government: 1.0,
    other: 2.2,
  };

  constructor(
    private readonly mlInfrastructure: MLInfrastructureService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Predict application success probability
   */
  async predictApplicationSuccess(input: ApplicationSuccessInput): Promise<PredictionResult> {
    const startTime = Date.now();

    try {
      // Fetch candidate and job data
      const [candidate, job, applications] = await Promise.all([
        this.prisma.candidateProfile.findUnique({ where: { userId: input.candidateId } }),
        this.prisma.jobPosting.findUnique({ where: { id: input.jobId } }),
        this.prisma.application.findMany({
          where: { jobId: input.jobId },
          take: 100,
        }),
      ]);

      if (!candidate || !job) {
        throw new Error('Candidate or job not found');
      }

      // Calculate base success factors
      const factors: PredictionFactor[] = [];
      
      // Resume score factor
      const resumeScore = input.applicationData?.resumeScore || 0.7;
      factors.push({
        name: 'resume_quality',
        value: resumeScore,
        impact: resumeScore * 0.25,
        description: 'Quality of candidate resume',
      });

      // Skills match factor
      const candidateSkills = (candidate.skills || []) as string[];
      const jobSkills = (job.skills || []) as string[];
      const skillsMatch = this.calculateSkillsMatch(candidateSkills, jobSkills);
      factors.push({
        name: 'skills_match',
        value: skillsMatch,
        impact: skillsMatch * 0.25,
        description: 'Match between candidate skills and job requirements',
      });

      // Experience match factor
      const experienceMatch = this.calculateExperienceMatch(candidate, job);
      factors.push({
        name: 'experience_match',
        value: experienceMatch,
        impact: experienceMatch * 0.2,
        description: 'Candidate experience level vs job requirements',
      });

      // Historical success rate for similar applications
      const historicalSuccess = this.calculateHistoricalSuccess(applications);
      factors.push({
        name: 'historical_success',
        value: historicalSuccess,
        impact: historicalSuccess * 0.15,
        description: 'Historical success rate for similar applications',
      });

      // Application completeness factor
      const completeness = input.applicationData?.responseCompleteness || 0.8;
      factors.push({
        name: 'application_completeness',
        value: completeness,
        impact: completeness * 0.15,
        description: 'Completeness of application materials',
      });

      // Calculate prediction using weighted factors
      let prediction = factors.reduce((sum, f) => sum + f.impact, 0);
      
      // Apply sigmoid function for probability
      prediction = this.sigmoid(prediction * 2 - 1);

      // Calculate confidence based on data availability
      const confidence = this.calculateConfidence(input.applicationData, applications.length);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Application success prediction completed in ${processingTime}ms`);

      // Generate recommendations
      const recommendations = this.generateSuccessRecommendations(factors, prediction);

      // Store prediction result
      await this.storePredictionResult(
        'APPLICATION_SUCCESS',
        input.candidateId,
        prediction,
        confidence,
        factors,
      );

      return {
        prediction,
        confidence,
        factors,
        modelVersion: '1.0.0',
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Application success prediction failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Estimate time-to-hire
   */
  async estimateTimeToHire(input: TimeToHireInput): Promise<PredictionResult> {
    const startTime = Date.now();

    try {
      const job = await this.prisma.jobPosting.findUnique({
        where: { id: input.jobId },
      });

      if (!job) {
        throw new Error('Job not found');
      }

      // Base time-to-hire by job level
      const baseTimes: Record<string, number> = {
        entry: 21,
        junior: 28,
        mid: 35,
        senior: 45,
        executive: 60,
      };

      const level = (job.experienceLevel || 'mid').toLowerCase();
      let estimatedDays = baseTimes[level] || 35;

      // Adjust for market conditions
      const marketConditions = input.marketConditions || {};
      if (marketConditions.unemploymentRate && marketConditions.unemploymentRate < 4) {
        estimatedDays *= 1.2; // Longer in tight labor market
      }
      if (marketConditions.industryGrowth && marketConditions.industryGrowth > 5) {
        estimatedDays *= 1.15; // Longer in high-growth industries
      }
      if (marketConditions.competitionLevel && marketConditions.competitionLevel > 0.7) {
        estimatedDays *= 1.1; // Longer with high competition
      }

      // Adjust for candidate factors
      const candidate = await this.prisma.candidateProfile.findUnique({
        where: { userId: input.candidateId },
      });

      if (candidate) {
        const skills = (candidate.skills || []) as string[];
        const requiredSkills = (job.skills || []) as string[];
        const skillsMatch = this.calculateSkillsMatch(skills, requiredSkills);
        
        if (skillsMatch > 0.8) {
          estimatedDays *= 0.9; // Faster for well-matched candidates
        } else if (skillsMatch < 0.5) {
          estimatedDays *= 1.2; // Slower for underqualified candidates
        }
      }

      // Calculate prediction as probability of hire within timeframes
      const prediction = estimatedDays;
      const confidence = 0.75;

      const factors: PredictionFactor[] = [
        {
          name: 'job_level',
          value: baseTimes[level] || 35,
          impact: 0.3,
          description: 'Base time by job level',
        },
        {
          name: 'market_conditions',
          value: marketConditions.unemploymentRate || 0.05,
          impact: 0.2,
          description: 'Impact of current market conditions',
        },
        {
          name: 'candidate_fit',
          value: 0.7,
          impact: 0.25,
          description: 'Candidate fit with job requirements',
        },
        {
          name: 'process_complexity',
          value: level === 'executive' ? 0.9 : 0.5,
          impact: 0.25,
          description: 'Complexity of hiring process',
        },
      ];

      const processingTime = Date.now() - startTime;
      this.logger.log(`Time-to-hire estimation completed in ${processingTime}ms`);

      return {
        prediction,
        confidence,
        factors,
        modelVersion: '1.0.0',
        recommendations: [
          `Estimated hiring timeline: ${Math.round(estimatedDays)} days`,
          'Prepare for interviews early to accelerate process',
          'Ensure all required approvals are in place',
        ],
      };
    } catch (error) {
      this.logger.error(`Time-to-hire estimation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Predict career trajectory
   */
  async predictCareerTrajectory(input: CareerTrajectoryInput): Promise<PredictionResult> {
    const startTime = Date.now();

    try {
      // Calculate trajectory based on factors
      const factors: PredictionFactor[] = [];

      // Experience factor
      const experienceScore = Math.min(input.yearsOfExperience / 20, 1);
      factors.push({
        name: 'experience',
        value: experienceScore,
        impact: experienceScore * 0.3,
        description: 'Years of experience factor',
      });

      // Skills factor
      const skillDemand = this.calculateSkillDemand(input.skills, input.currentIndustry);
      factors.push({
        name: 'skill_demand',
        value: skillDemand,
        impact: skillDemand * 0.25,
        description: 'Demand for current skills in market',
      });

      // Education factor
      const educationScores: Record<string, number> = {
        high_school: 0.5,
        associate: 0.6,
        bachelor: 0.75,
        master: 0.85,
        phd: 0.9,
      };
      const educationScore = educationScores[input.educationLevel.toLowerCase()] || 0.7;
      factors.push({
        name: 'education',
        value: educationScore,
        impact: educationScore * 0.2,
        description: 'Education level factor',
      });

      // Industry growth factor
      const industryGrowth = this.industryGrowthRates[input.currentIndustry.toLowerCase()] || 
        this.industryGrowthRates.other;
      factors.push({
        name: 'industry_growth',
        value: industryGrowth / 10,
        impact: (industryGrowth / 10) * 0.15,
        description: 'Growth rate of current industry',
      });

      // Goal alignment factor
      let goalAlignment = 0.7;
      if (input.goals && input.goals.length > 0) {
        goalAlignment = this.calculateGoalAlignment(input.goals, input.skills, input.currentIndustry);
      }
      factors.push({
        name: 'goal_alignment',
        value: goalAlignment,
        impact: goalAlignment * 0.1,
        description: 'Alignment of skills with career goals',
      });

      // Calculate trajectory prediction (0-100 score)
      const prediction = factors.reduce((sum, f) => sum + f.impact, 0) * 100;
      const confidence = 0.7;

      // Predict next roles
      const nextRoles = this.predictNextRoles(input);

      // Generate growth projections
      const projections = this.generateGrowthProjections(prediction, input.yearsOfExperience);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Career trajectory prediction completed in ${processingTime}ms`);

      // Store prediction
      await this.storePredictionResult(
        'CAREER_TRAJECTORY',
        input.candidateId,
        prediction / 100,
        confidence,
        factors,
      );

      return {
        prediction,
        confidence,
        factors,
        modelVersion: '1.0.0',
        recommendations: [
          `Projected trajectory score: ${Math.round(prediction)}/100`,
          'Consider upskilling in high-demand areas',
          `Potential next roles: ${nextRoles.slice(0, 3).join(', ')}`,
        ],
      };
    } catch (error) {
      this.logger.error(`Career trajectory prediction failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze hiring trends
   */
  async analyzeHiringTrends(industry?: string, timeframeMonths: number = 6): Promise<any> {
    const startTime = Date.now();

    try {
      // Get applications within timeframe
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - timeframeMonths);

      const applications = await this.prisma.application.findMany({
        where: {
          createdAt: { gte: startDate },
          ...(industry && { jobPosting: { some: { industry } } }),
        },
        include: { jobPosting: true },
      });

      // Analyze trends
      const totalApplications = applications.length;
      const successfulApplications = applications.filter(a => a.status === 'HIRED').length;
      const inProgressApplications = applications.filter(a => 
        !['HIRED', 'REJECTED', 'WITHDRAWN'].includes(a.status)
      ).length;

      // Calculate success rate by month
      const monthlyData: Record<string, { total: number; success: number }> = {};
      applications.forEach(app => {
        const month = app.createdAt.toISOString().slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { total: 0, success: 0 };
        }
        monthlyData[month].total += 1;
        if (app.status === 'HIRED') {
          monthlyData[month].success += 1;
        }
      });

      // Calculate growth rate
      const months = Object.keys(monthlyData).sort();
      let growthRate = 0;
      if (months.length >= 2) {
        const firstMonth = monthlyData[months[0]].total;
        const lastMonth = monthlyData[months[months.length - 1]].total;
        growthRate = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0;
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`Hiring trends analysis completed in ${processingTime}ms`);

      return {
        totalApplications,
        successfulApplications,
        inProgressApplications,
        successRate: totalApplications > 0 ? successfulApplications / totalApplications : 0,
        monthlyTrend: monthlyData,
        growthRate,
        industry: industry || 'all',
        timeframeMonths,
      };
    } catch (error) {
      this.logger.error(`Hiring trends analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Store prediction result
   */
  private async storePredictionResult(
    predictionType: string,
    targetId: string,
    prediction: number,
    confidence: number,
    factors: PredictionFactor[],
  ): Promise<void> {
    await this.prisma.predictionResult.create({
      data: {
        predictionType,
        targetId,
        prediction,
        confidence,
        factors: factors as any,
        modelVersion: '1.0.0',
      },
    });
  }

  /**
   * Calculate skills match
   */
  private calculateSkillsMatch(candidateSkills: string[], jobSkills: string[]): number {
    if (!jobSkills.length) return 0.8;
    
    const normalizedCandidate = candidateSkills.map(s => s.toLowerCase());
    const normalizedJob = jobSkills.map(s => s.toLowerCase());
    
    const matching = normalizedJob.filter(skill => 
      normalizedCandidate.some(cs => cs.includes(skill) || skill.includes(cs))
    );
    
    return matching.length / normalizedJob.length;
  }

  /**
   * Calculate experience match
   */
  private calculateExperienceMatch(candidate: any, job: any): number {
    // Simplified experience matching
    const experienceYears = Array.isArray(candidate.experience) ? candidate.experience.length : 0;
    const requiredYears = 3; // Default requirement
    
    if (experienceYears >= requiredYears) return 1;
    return Math.min(experienceYears / requiredYears, 1);
  }

  /**
   * Calculate historical success rate
   */
  private calculateHistoricalSuccess(applications: any[]): number {
    if (applications.length === 0) return 0.5;
    
    const successful = applications.filter(a => a.status === 'HIRED').length;
    return successful / applications.length;
  }

  /**
   * Calculate confidence based on data availability
   */
  private calculateConfidence(applicationData: ApplicationSuccessInput['applicationData'] | undefined, historicalCount: number): number {
    let confidence = 0.5;
    
    if (applicationData) {
      if (applicationData.resumeScore !== undefined) confidence += 0.1;
      if (applicationData.coverLetterQuality !== undefined) confidence += 0.1;
      if (applicationData.responseCompleteness !== undefined) confidence += 0.1;
    }
    
    if (historicalCount >= 10) confidence += 0.2;
    else if (historicalCount >= 5) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Calculate skill demand
   */
  private calculateSkillDemand(skills: string[], industry: string): number {
    // Simplified demand calculation
    const highDemandSkills = ['python', 'machine learning', 'cloud', 'data science', 'react', 'node'];
    const matchingSkills = skills.filter(s => 
      highDemandSkills.some(hds => s.toLowerCase().includes(hds))
    );
    
    return Math.min(0.5 + (matchingSkills.length * 0.1), 1);
  }

  /**
   * Calculate goal alignment
   */
  private calculateGoalAlignment(goals: string[], skills: string[], industry: string): number {
    // Simplified goal alignment calculation
    const goalKeywords = ['leadership', 'management', 'senior', 'director', 'principal', 'expert'];
    const matching = goals.filter(g => 
      goalKeywords.some(kw => g.toLowerCase().includes(kw))
    );
    
    return 0.5 + (matching.length * 0.15);
  }

  /**
   * Predict next career roles
   */
  private predictNextRoles(input: CareerTrajectoryInput): string[] {
    const roleProgression: Record<string, string[]> = {
      'software engineer': ['senior software engineer', 'staff engineer', 'principal engineer'],
      'developer': ['senior developer', 'tech lead', 'architect'],
      'analyst': ['senior analyst', 'lead analyst', 'analytics manager'],
      'manager': ['senior manager', 'director', 'vp'],
      'designer': ['senior designer', 'lead designer', 'design manager'],
    };

    const key = Object.keys(roleProgression).find(k => 
      input.currentRole.toLowerCase().includes(k)
    );

    return key ? roleProgression[key] : ['senior ' + input.currentRole, 'lead ' + input.currentRole];
  }

  /**
   * Generate growth projections
   */
  private generateGrowthProjections(trajectoryScore: number, yearsExperience: number): any[] {
    const projections = [];
    
    if (trajectoryScore > 70) {
      projections.push({ timeframe: '1 year', expected: 'Senior role promotion' });
      projections.push({ timeframe: '3 years', expected: 'Leadership track' });
      projections.push({ timeframe: '5 years', expected: 'Director/VP level' });
    } else if (trajectoryScore > 50) {
      projections.push({ timeframe: '1 year', expected: 'Promotion to next level' });
      projections.push({ timeframe: '3 years', expected: 'Specialist or team lead' });
      projections.push({ timeframe: '5 years', expected: 'Senior specialist' });
    } else {
      projections.push({ timeframe: '1 year', expected: 'Strengthen current role' });
      projections.push({ timeframe: '3 years', expected: 'Consider lateral move' });
      projections.push({ timeframe: '5 years', expected: 'Explore new directions' });
    }
    
    return projections;
  }

  /**
   * Generate success recommendations
   */
  private generateSuccessRecommendations(factors: PredictionFactor[], prediction: number): string[] {
    const recommendations: string[] = [];
    
    const lowFactors = factors.filter(f => f.impact < 0.1);
    
    if (prediction > 0.7) {
      recommendations.push('Strong candidate - proceed with interview');
    } else if (prediction > 0.5) {
      recommendations.push('Moderate match - consider for interview with preparation');
    } else {
      recommendations.push('Consider other candidates with stronger fit');
    }
    
    if (lowFactors.length > 0) {
      const names = lowFactors.map(f => f.name.replace(/_/g, ' ')).join(', ');
      recommendations.push(`Focus on improving: ${names}`);
    }
    
    return recommendations;
  }

  /**
   * Sigmoid function for probability
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
}
