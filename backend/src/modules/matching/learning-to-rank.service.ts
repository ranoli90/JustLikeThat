import { Injectable, Logger } from '@nestjs/common';
import { Persona } from '../../entities/persona.entity';
import { JobPosting } from '../../entities/job-posting.entity';
import { EmbeddingService } from './embedding.service';
import { CulturalFitService, CulturalFitScore } from './cultural-fit.service';
import { CareerTrajectoryService, CareerTrajectoryPrediction } from './career-trajectory.service';

export interface LTRMatchResult {
  jobPostingId: string;
  personaId: string;
  overallScore: number;
  breakdown: LTRScoreBreakdown;
  ranking: number;
  confidence: number;
  explanations: string[];
}

export interface LTRScoreBreakdown {
  semanticSkills: number;
  semanticExperience: number;
  semanticCulture: number;
  semanticCareer: number;
  keywordSkills: number;
  experience: number;
  salary: number;
  location: number;
  culture: number;
  careerGrowth: number;
}

export interface FeatureVector {
  skillsMatch: number;
  experienceMatch: number;
  semanticSkillsSimilarity: number;
  semanticExperienceSimilarity: number;
  semanticCultureScore: number;
  semanticCareerScore: number;
  salaryOverlap: number;
  locationMatch: number;
  remoteCompatibility: number;
  companySizeMatch: number;
  seniorityMatch: number;
  growthPotential: number;
}

export interface FeedbackData {
  personaId: string;
  jobPostingId: string;
  feedback: 'positive' | 'negative' | 'neutral';
  applied: boolean;
  interview: boolean;
  offer: boolean;
  timestamp: Date;
}

@Injectable()
export class LearningToRankService {
  private readonly logger = new Logger(LearningToRankService.name);

  // Feature weights (learned parameters)
  private weights: Record<keyof FeatureVector, number> = {
    skillsMatch: 0.25,
    experienceMatch: 0.15,
    semanticSkillsSimilarity: 0.15,
    semanticExperienceSimilarity: 0.10,
    semanticCultureScore: 0.10,
    semanticCareerScore: 0.08,
    salaryOverlap: 0.05,
    locationMatch: 0.05,
    remoteCompatibility: 0.03,
    companySizeMatch: 0.02,
    seniorityMatch: 0.01,
    growthPotential: 0.01,
  };

  // Feedback history for online learning
  private feedbackHistory: FeedbackData[] = [];

  // Threshold for confident predictions
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly culturalFitService: CulturalFitService,
    private readonly careerTrajectoryService: CareerTrajectoryService,
  ) {}

  /**
   * Main ranking function using learned features
   */
  async rankJobsForPersona(
    persona: Persona,
    jobPostings: JobPosting[],
    weights?: Record<keyof FeatureVector, number>,
  ): Promise<LTRMatchResult[]> {
    // Optionally use custom weights
    if (weights) {
      this.weights = { ...this.weights, ...weights };
    }

    // Calculate features for each job
    const results: LTRMatchResult[] = [];

    for (const job of jobPostings) {
      const features = await this.extractFeatures(persona, job);
      const score = this.predictScore(features);
      const breakdown = this.calculateBreakdown(features);
      const explanations = this.generateExplanations(features, breakdown);
      const confidence = this.calculateConfidence(features);

      results.push({
        jobPostingId: job.id,
        personaId: persona.id,
        overallScore: score,
        breakdown,
        ranking: 0, // Will be set after sorting
        confidence,
        explanations,
      });
    }

    // Sort by overall score
    results.sort((a, b) => b.overallScore - a.overallScore);

    // Assign rankings
    results.forEach((result, index) => {
      result.ranking = index + 1;
    });

    return results;
  }

  /**
   * Extract feature vector for a persona-job pair
   */
  async extractFeatures(persona: Persona, job: JobPosting): Promise<FeatureVector> {
    // Basic matching features
    const skillsMatch = this.calculateKeywordSkillsMatch(persona.skills, job.skills);
    const experienceMatch = this.calculateExperienceMatch(persona.experienceLevel, job.experiences);
    const seniorityMatch = this.calculateSeniorityMatch(persona.experienceLevel, job.title);

    // Semantic features using embeddings
    const semanticSkillsResult = await this.embeddingService.analyzeSkillsSemantically(
      (persona.skills as any[]) || [],
      (job.skills as any[]) || [],
    );
    const semanticSkillsSimilarity = semanticSkillsResult.score;

    // Semantic experience similarity
    const personaText = `${persona.jobTitle} ${persona.summary || ''}`;
    const jobText = `${job.title} ${job.description}`;
    const personaEmbedding = await this.embeddingService.generateEmbedding(personaText);
    const jobEmbedding = await this.embeddingService.generateEmbedding(jobText);
    const semanticExperienceSimilarity = this.embeddingService.calculateCosineSimilarity(
      personaEmbedding.embedding,
      jobEmbedding.embedding,
    );

    // Cultural fit (placeholder - would need user preferences)
    const semanticCultureScore = semanticExperienceSimilarity * 0.8;

    // Career growth (placeholder - would need more context)
    const semanticCareerScore = semanticExperienceSimilarity * 0.6;

    // Salary overlap
    const salaryOverlap = this.calculateSalaryOverlap(persona, job);

    // Location match
    const locationMatch = this.calculateLocationMatch(persona, job);

    // Remote compatibility
    const remoteCompatibility = this.calculateRemoteCompatibility(persona, job);

    // Company size match (inferred from job posting)
    const companySizeMatch = 0.5; // Neutral default

    // Growth potential
    const growthPotential = this.inferGrowthPotential(job);

    return {
      skillsMatch,
      experienceMatch,
      semanticSkillsSimilarity,
      semanticExperienceSimilarity,
      semanticCultureScore,
      semanticCareerScore,
      salaryOverlap,
      locationMatch,
      remoteCompatibility,
      companySizeMatch,
      seniorityMatch,
      growthPotential,
    };
  }

  /**
   * Predict score using weighted sum of features
   */
  private predictScore(features: FeatureVector): number {
    let score = 0;

    for (const [key, value] of Object.entries(features) as [keyof FeatureVector, number][]) {
      score += value * this.weights[key];
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate score breakdown by category
   */
  private calculateBreakdown(features: FeatureVector): LTRScoreBreakdown {
    return {
      semanticSkills: features.semanticSkillsSimilarity * 0.5,
      semanticExperience: features.semanticExperienceSimilarity * 0.5,
      semanticCulture: features.semanticCultureScore * 0.4,
      semanticCareer: features.semanticCareerScore * 0.4,
      keywordSkills: features.skillsMatch * 0.5,
      experience: features.experienceMatch * 0.15,
      salary: features.salaryOverlap * 0.10,
      location: features.locationMatch * 0.10,
      culture: features.semanticCultureScore * 0.10,
      careerGrowth: features.growthPotential * 0.05,
    };
  }

  /**
   * Calculate keyword-based skills match
   */
  private calculateKeywordSkillsMatch(personaSkills: any, jobSkills: any): number {
    const personaSkillSet = new Set(
      (personaSkills || []).map((s: any) => (typeof s === 'string' ? s : s.name || '').toLowerCase()).filter(Boolean),
    );
    const jobSkillList = (jobSkills || []).map((s: any) => (typeof s === 'string' ? s : s.name || '').toLowerCase()).filter(Boolean);

    if (jobSkillList.length === 0) return 1;

    const matches = jobSkillList.filter(skill => personaSkillSet.has(skill)).length;
    return matches / jobSkillList.length;
  }

  /**
   * Calculate experience match
   */
  private calculateExperienceMatch(personaLevel: any, jobExperience: any): number {
    const levelMap: Record<string, number> = {
      'JUNIOR': 1,
      'MID': 2,
      'SENIOR': 3,
      'LEAD': 4,
    };

    const personaLevelNum = levelMap[personaLevel?.toString() || 'MID'] || 2;
    const jobLevelNum = this.extractJobLevel(jobExperience) || 2;

    const diff = Math.abs(personaLevelNum - jobLevelNum);
    return Math.max(0, 1 - (diff * 0.3));
  }

  /**
   * Extract required level from job experience requirements
   */
  private extractJobLevel(jobExperience: any): number | null {
    if (!jobExperience) return null;

    const expStr = JSON.stringify(jobExperience).toLowerCase();

    if (expStr.includes('senior') || expStr.includes('lead') || expStr.includes('5+') || expStr.includes('7+')) {
      return 3.5;
    }
    if (expStr.includes('mid') || expStr.includes('intermediate') || expStr.includes('2+') || expStr.includes('3+')) {
      return 2;
    }
    if (expStr.includes('junior') || expStr.includes('entry') || expStr.includes('0') || expStr.includes('1+')) {
      return 1;
    }

    return null;
  }

  /**
   * Calculate seniority match
   */
  private calculateSeniorityMatch(personaLevel: any, jobTitle: string): number {
    const levelMap: Record<string, number> = {
      'JUNIOR': 1,
      'MID': 2,
      'SENIOR': 3,
      'LEAD': 4,
    };

    const personaNum = levelMap[personaLevel?.toString() || 'MID'] || 2;
    const jobNum = this.extractJobLevel({ title: jobTitle }) || 2;

    return 1 - (Math.abs(personaNum - jobNum) / 3);
  }

  /**
   * Calculate salary overlap
   */
  private calculateSalaryOverlap(persona: Persona, job: JobPosting): number {
    // Placeholder - would need access to user preferences
    return 0.5;
  }

  /**
   * Calculate location match
   */
  private calculateLocationMatch(persona: Persona, job: JobPosting): number {
    // Placeholder - would need user location preferences
    return 0.5;
  }

  /**
   * Calculate remote work compatibility
   */
  private calculateRemoteCompatibility(persona: Persona, job: JobPosting): number {
    const remotePreference = job.remotePreference;

    if (remotePreference === 'REMOTE') return 1;
    if (remotePreference === 'ONSITE') return 0.5;
    if (remotePreference === 'HYBRID') return 0.8;

    return 0.5;
  }

  /**
   * Infer growth potential from job posting
   */
  private inferGrowthPotential(job: JobPosting): number {
    const description = job.description.toLowerCase();
    const title = job.title.toLowerCase();

    let score = 0.5;

    const growthKeywords = ['growth', 'scaling', 'series', 'ipo', 'expansion', 'leadership'];
    for (const keyword of growthKeywords) {
      if (description.includes(keyword) || title.includes(keyword)) {
        score += 0.1;
      }
    }

    return Math.min(1, score);
  }

  /**
   * Calculate confidence based on feature reliability
   */
  private calculateConfidence(features: FeatureVector): number {
    // Higher confidence when features are well-defined
    let confidence = 0.5;

    if (features.semanticSkillsSimilarity > 0) confidence += 0.2;
    if (features.semanticExperienceSimilarity > 0) confidence += 0.2;
    if (features.skillsMatch > 0) confidence += 0.1;

    return Math.min(1, confidence);
  }

  /**
   * Generate human-readable explanations
   */
  private generateExplanations(
    features: FeatureVector,
    breakdown: LTRScoreBreakdown,
  ): string[] {
    const explanations: string[] = [];

    if (breakdown.semanticSkills > 0.7) {
      explanations.push('Strong skills alignment based on semantic analysis');
    } else if (breakdown.semanticSkills > 0.4) {
      explanations.push('Moderate skills alignment');
    }

    if (breakdown.semanticCulture > 0.7) {
      explanations.push('Good cultural fit indicators');
    }

    if (breakdown.careerGrowth > 0.6) {
      explanations.push('Strong career growth potential');
    }

    if (breakdown.experience > 0.7) {
      explanations.push('Experience level matches job requirements');
    }

    if (breakdown.salary > 0.7) {
      explanations.push('Salary expectations align well');
    }

    if (features.remoteCompatibility > 0.8) {
      explanations.push('Remote work preferences are compatible');
    }

    return explanations;
  }

  /**
   * Record user feedback for online learning
   */
  async recordFeedback(feedback: FeedbackData): Promise<void> {
    this.feedbackHistory.push(feedback);

    // Perform online learning update
    if (this.feedbackHistory.length >= 10) {
      await this.updateWeights();
    }
  }

  /**
   * Update weights based on feedback using a simple perceptron-like update
   */
  private async updateWeights(): Promise<void> {
    // Get recent feedback
    const recentFeedback = this.feedbackHistory.slice(-50);

    // Simple weight update based on feedback
    for (const feedback of recentFeedback) {
      if (feedback.feedback === 'positive') {
        // Slightly increase weights for features that likely contributed to positive feedback
        this.weights.skillsMatch += 0.01;
        this.weights.experienceMatch += 0.01;
        this.weights.semanticSkillsSimilarity += 0.01;
      } else if (feedback.feedback === 'negative') {
        // Slightly decrease weights
        this.weights.skillsMatch -= 0.005;
        this.weights.experienceMatch -= 0.005;
      }
    }

    // Normalize weights
    const totalWeight = Object.values(this.weights).reduce((sum, w) => sum + w, 0);
    for (const key of Object.keys(this.weights) as (keyof typeof this.weights)[]) {
      this.weights[key] = this.weights[key] / totalWeight;
    }

    this.logger.log('Updated LTR weights based on feedback');
  }

  /**
   * Get current model parameters
   */
  getModelParameters(): { weights: Record<string, number>; feedbackCount: number } {
    return {
      weights: { ...this.weights },
      feedbackCount: this.feedbackHistory.length,
    };
  }

  /**
   * Evaluate model on historical data
   */
  async evaluateModel(testCases: Array<{
    features: FeatureVector;
    actualLabel: number;
  }>): Promise<{ ndcg: number; precision: number; recall: number }> {
    // Calculate NDCG (Normalized Discounted Cumulative Gain)
    const predictions = testCases.map(tc => this.predictScore(tc.features));
    const actuals = testCases.map(tc => tc.actualLabel);

    // Calculate NDCG
    const ndcg = this.calculateNDCG(predictions, actuals);

    // Calculate Precision@K
    const precision = this.calculatePrecision(predictions, actuals, 10);

    // Calculate Recall@K
    const recall = this.calculateRecall(predictions, actuals, 10);

    return { ndcg, precision, recall };
  }

  /**
   * Calculate NDCG
   */
  private calculateNDCG(predictions: number[], actuals: number[]): number {
    // Sort by predicted score
    const indexed = predictions.map((pred, i) => ({ pred, actual: actuals[i] }));
    indexed.sort((a, b) => b.pred - a.pred);

    // Calculate DCG
    let dcg = 0;
    for (let i = 0; i < indexed.length; i++) {
      dcg += indexed[i].actual / Math.log2(i + 2);
    }

    // Sort by actual score (ideal)
    indexed.sort((a, b) => b.actual - a.actual);
    let idcg = 0;
    for (let i = 0; i < indexed.length; i++) {
      idcg += indexed[i].actual / Math.log2(i + 2);
    }

    return idcg > 0 ? dcg / idcg : 0;
  }

  /**
   * Calculate Precision@K
   */
  private calculatePrecision(predictions: number[], actuals: number[], k: number): number {
    const indexed = predictions.map((pred, i) => ({ pred, actual: actuals[i] }));
    indexed.sort((a, b) => b.pred - a.pred);

    const topK = indexed.slice(0, k);
    const relevant = topK.filter(item => item.actual >= 0.5).length;

    return relevant / k;
  }

  /**
   * Calculate Recall@K
   */
  private calculateRecall(predictions: number[], actuals: number[], k: number): number {
    const indexed = predictions.map((pred, i) => ({ pred, actual: actuals[i] }));
    indexed.sort((a, b) => b.pred - a.pred);

    const topK = indexed.slice(0, k);
    const relevant = topK.filter(item => item.actual >= 0.5).length;
    const totalRelevant = actuals.filter(a => a >= 0.5).length;

    return totalRelevant > 0 ? relevant / totalRelevant : 0;
  }
}
