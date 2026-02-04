import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from '../../entities/persona.entity';
import { JobPosting } from '../../entities/job-posting.entity';
import { UserPreferences } from '../../entities/user-preferences.entity';
import { EmbeddingService } from './embedding.service';
import { CulturalFitService } from './cultural-fit.service';
import { CareerTrajectoryService } from './career-trajectory.service';
import { LearningToRankService, LTRMatchResult } from './learning-to-rank.service';

export interface JobRecommendation {
  jobPosting: JobPosting;
  matchResult: LTRMatchResult;
  whyRecommended: string[];
  potentialConcerns: string[];
  applied: boolean;
  saved: boolean;
}

export interface RecommendationContext {
  userId: string;
  personaId: string;
  preferences: UserPreferences;
  searchQuery?: string;
  location?: string;
  filters?: Record<string, any>;
}

export interface RecommendationExplanation {
  recommendationType: 'similar_jobs' | 'career_growth' | 'high_match' | 'new_opportunity';
  confidence: number;
  factors: string[];
  suggestedActions: string[];
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(JobPosting)
    private readonly jobPostingRepository: Repository<JobPosting>,
    private readonly embeddingService: EmbeddingService,
    private readonly culturalFitService: CulturalFitService,
    private readonly careerTrajectoryService: CareerTrajectoryService,
    private readonly ltrService: LearningToRankService,
  ) {}

  /**
   * Get personalized job recommendations for a user
   */
  async getRecommendations(
    context: RecommendationContext,
    limit: number = 20,
  ): Promise<JobRecommendation[]> {
    const { personaId, preferences, searchQuery, location, filters } = context;

    // Get persona
    const persona = await this.personaRepository.findOne({
      where: { id: personaId },
    });

    if (!persona) {
      throw new Error('Persona not found');
    }

    // Build query for job search
    const jobQuery = this.jobPostingRepository
      .createQueryBuilder('job')
      .where('job.isExpired = :isExpired', { isExpired: false });

    // Apply search filters
    if (searchQuery) {
      jobQuery.andWhere(
        '(job.title ILIKE :search OR job.description ILIKE :search OR job.company ILIKE :search)',
        { search: `%${searchQuery}%` },
      );
    }

    if (location) {
      jobQuery.andWhere('job.location ILIKE :location', { location: `%${location}%` });
    }

    // Apply filters
    if (filters?.jobType) {
      jobQuery.andWhere('job.jobType = :jobType', { jobType: filters.jobType });
    }

    if (filters?.remotePreference) {
      jobQuery.andWhere('job.remotePreference = :remote', { remote: filters.remotePreference });
    }

    if (filters?.minSalary) {
      jobQuery.andWhere('(job.salaryRange IS NULL OR (job.salaryRange->>\'min\')::int >= :minSalary)', {
        minSalary: filters.minSalary,
      });
    }

    // Get jobs
    const jobPostings = await jobQuery.limit(limit * 2).getMany();

    // Rank jobs using LTR
    const rankedResults = await this.ltrService.rankJobsForPersona(persona, jobPostings);

    // Build recommendations
    const recommendations: JobRecommendation[] = [];

    for (const result of rankedResults.slice(0, limit)) {
      const job = jobPostings.find(j => j.id === result.jobPostingId);
      if (!job) continue;

      const explanation = await this.explainRecommendation(persona, job, result);

      recommendations.push({
        jobPosting: job,
        matchResult: result,
        whyRecommended: explanation.factors,
        potentialConcerns: this.identifyConcerns(persona, job, result),
        applied: false,
        saved: false,
      });
    }

    return recommendations;
  }

  /**
   * Get similar jobs to a specific job
   */
  async getSimilarJobs(
    jobPostingId: string,
    personaId: string,
    limit: number = 10,
  ): Promise<JobRecommendation[]> {
    const jobPosting = await this.jobPostingRepository.findOne({
      where: { id: jobPostingId },
    });

    if (!jobPosting) {
      throw new Error('Job not found');
    }

    const persona = await this.personaRepository.findOne({
      where: { id: personaId },
    });

    if (!persona) {
      throw new Error('Persona not found');
    }

    // Generate embedding for the job
    const jobEmbedding = await this.embeddingService.generateJobEmbedding(jobPosting);

    // Find similar jobs using embeddings
    const similarJobs = await this.embeddingService.findSimilarJobs(
      jobEmbedding.embedding,
      limit + 1,
      jobPosting.tenantId,
    );

    // Filter out the original job
    const filteredJobs = similarJobs.filter(sj => sj.jobPosting.id !== jobPostingId).slice(0, limit);

    // Rank the similar jobs
    const rankedResults = await this.ltrService.rankJobsForPersona(
      persona,
      filteredJobs.map(sj => sj.jobPosting),
    );

    return filteredJobs.map((sj, index) => ({
      jobPosting: sj.jobPosting,
      matchResult: rankedResults.find(r => r.jobPostingId === sj.jobPosting.id) || {
        jobPostingId: sj.jobPosting.id,
        personaId,
        overallScore: sj.similarity,
        breakdown: {} as any,
        ranking: index + 1,
        confidence: sj.similarity,
        explanations: ['Similar to previously viewed job'],
      },
      whyRecommended: ['Similar to job you were interested in', `Similarity score: ${Math.round(sj.similarity * 100)}%`],
      potentialConcerns: [],
      applied: false,
      saved: false,
    }));
  }

  /**
   * Get career growth recommendations
   */
  async getCareerGrowthRecommendations(
    personaId: string,
    limit: number = 10,
  ): Promise<JobRecommendation[]> {
    const persona = await this.personaRepository.findOne({
      where: { id: personaId },
    });

    if (!persona) {
      throw new Error('Persona not found');
    }

    // Find jobs that would be a step up
    const nextLevelJobs = await this.jobPostingRepository
      .createQueryBuilder('job')
      .where('job.isExpired = :isExpired', { isExpired: false })
      .andWhere('job.title ILIKE :title', {
        title: `%${this.getNextLevelTitle(persona.experienceLevel)}%`,
      })
      .limit(limit * 2)
      .getMany();

    // Rank by career growth potential
    const rankedResults = await this.ltrService.rankJobsForPersona(persona, nextLevelJobs);

    const recommendations: JobRecommendation[] = [];

    for (const result of rankedResults.slice(0, limit)) {
      const job = nextLevelJobs.find(j => j.id === result.jobPostingId);
      if (!job) continue;

      const trajectory = await this.careerTrajectoryService.predictTrajectory(persona, job);

      recommendations.push({
        jobPosting: job,
        matchResult: result,
        whyRecommended: [
          `Next step in your career: ${trajectory.nextRole}`,
          `Salary growth potential: +${Math.round(trajectory.salaryProjection.growth * 100)}%`,
          `Growth potential: ${trajectory.growthPotential}`,
        ],
        potentialConcerns: trajectory.skillGap.missingSkills.map(
          skill => `May need to learn: ${skill}`,
        ),
        applied: false,
        saved: false,
      });
    }

    return recommendations;
  }

  /**
   * Get recently viewed/similar recommendations
   */
  async getTrendingJobs(
    personaId: string,
    limit: number = 10,
  ): Promise<JobRecommendation[]> {
    const persona = await this.personaRepository.findOne({
      where: { id: personaId },
    });

    if (!persona) {
      throw new Error('Persona not found');
    }

    // Get jobs sorted by creation date (most recent)
    const recentJobs = await this.jobPostingRepository
      .createQueryBuilder('job')
      .where('job.isExpired = :isExpired', { isExpired: false })
      .orderBy('job.createdAt', 'DESC')
      .limit(limit * 2)
      .getMany();

    // Rank by relevance
    const rankedResults = await this.ltrService.rankJobsForPersona(persona, recentJobs);

    return rankedResults.slice(0, limit).map(result => {
      const job = recentJobs.find(j => j.id === result.jobPostingId);
      return {
        jobPosting: job!,
        matchResult: result,
        whyRecommended: ['New opportunity in your field', 'Recently posted'],
        potentialConcerns: [],
        applied: false,
        saved: false,
      };
    });
  }

  /**
   * Explain why a job is recommended
   */
  private async explainRecommendation(
    persona: Persona,
    job: JobPosting,
    matchResult: LTRMatchResult,
  ): Promise<RecommendationExplanation> {
    const factors: string[] = [];
    let recommendationType: RecommendationExplanation['recommendationType'] = 'high_match';

    // Check match score
    if (matchResult.overallScore >= 0.8) {
      recommendationType = 'high_match';
      factors.push('Excellent overall match score');
    } else if (matchResult.overallScore >= 0.6) {
      recommendationType = 'similar_jobs';
      factors.push('Good skills alignment');
    }

    // Check semantic similarity
    if (matchResult.breakdown?.semanticSkills > 0.7) {
      factors.push('Skills match your expertise');
    }

    // Check career growth
    const trajectory = await this.careerTrajectoryService.predictTrajectory(persona, job);
    if (trajectory.growthPotential === 'high') {
      recommendationType = 'career_growth';
      factors.push('High growth potential');
    }

    // Check if new opportunity
    const daysSincePosted = (Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePosted < 7) {
      recommendationType = 'new_opportunity';
      factors.push('Recently posted');
    }

    const suggestedActions: string[] = [];
    if (matchResult.overallScore >= 0.7) {
      suggestedActions.push('Apply now - good match!');
    } else {
      suggestedActions.push('Review job details carefully');
    }

    return {
      recommendationType,
      confidence: matchResult.confidence,
      factors,
      suggestedActions,
    };
  }

  /**
   * Identify potential concerns about a job recommendation
   */
  private identifyConcerns(
    persona: Persona,
    job: JobPosting,
    matchResult: LTRMatchResult,
  ): string[] {
    const concerns: string[] = [];

    // Check if experience level doesn't match
    if (matchResult.breakdown?.experience < 0.5) {
      concerns.push('Experience level may not match');
    }

    // Check if salary might be low
    if (job.salaryRange) {
      const salaryRange = job.salaryRange as { min?: number; max?: number };
      if (salaryRange.min && salaryRange.min < 50000) {
        concerns.push('Salary may be below market rate');
      }
    }

    // Check if job is old
    const daysSincePosted = (Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePosted > 30) {
      concerns.push('Job posting may no longer be active');
    }

    // Check low confidence
    if (matchResult.confidence < 0.5) {
      concerns.push('Limited information for accurate matching');
    }

    return concerns;
  }

  /**
   * Get next level job title based on current level
   */
  private getNextLevelTitle(currentLevel: any): string {
    const titles: Record<string, string> = {
      'JUNIOR': 'mid-level',
      'MID': 'senior',
      'SENIOR': 'lead',
      'LEAD': 'principal',
    };
    return titles[currentLevel?.toString() || 'MID'] || 'senior';
  }

  /**
   * Update recommendations based on user interaction
   */
  async updateRecommendations(
    personaId: string,
    jobPostingId: string,
    interaction: 'save' | 'unsave' | 'view' | 'apply' | 'dismiss',
  ): Promise<void> {
    // Record interaction for recommendation learning
    // This would typically update a user_interactions table
    this.logger.log(`User interaction: ${interaction} on job ${jobPostingId} for persona ${personaId}`);
  }

  /**
   * Get recommendation analytics
   */
  async getRecommendationAnalytics(personaId: string): Promise<{
    totalRecommendations: number;
    appliedCount: number;
    savedCount: number;
    topFactors: string[];
  }> {
    // Placeholder - would query interaction history
    return {
      totalRecommendations: 0,
      appliedCount: 0,
      savedCount: 0,
      topFactors: ['Skills match', 'Career growth', 'Company culture'],
    };
  }
}
