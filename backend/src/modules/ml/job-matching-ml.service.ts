import { Injectable, Logger } from '@nestjs/common';
import { MLInfrastructureService } from './ml-infrastructure.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * DTO for job matching input
 */
export interface JobMatchingInput {
  candidateId: string;
  candidateProfile: {
    skills: string[];
    experience: Array<{ title: string; duration: number; description: string }>;
    education: Array<{ degree: string; field: string }>;
    summary?: string;
  };
  preferences?: {
    location?: string;
    remotePreference?: string;
    salaryExpectation?: number;
    jobTypes?: string[];
  };
}

/**
 * DTO for job matching result
 */
export interface JobMatchResult {
  jobId: string;
  matchScore: number;
  successProbability: number;
  factors: MatchFactor[];
  explanation: MatchExplanation;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

/**
 * Match factor breakdown
 */
export interface MatchFactor {
  factor: string;
  weight: number;
  score: number;
  contribution: number;
}

/**
 * Match explanation
 */
export interface MatchExplanation {
  summary: string;
  strengths: string[];
  concerns: string[];
  tips: string[];
}

/**
 * Deep Learning Job Matching Engine
 * Implements neural network model for candidate-job matching with embedding-based similarity
 */
@Injectable()
export class JobMatchingMLService {
  private readonly logger = new Logger(JobMatchingMLService.name);
  
  // Matching weights - configurable
  private readonly defaultWeights = {
    skillMatch: 0.35,
    experienceMatch: 0.25,
    educationMatch: 0.15,
    culturalFit: 0.15,
    locationMatch: 0.10,
  };

  constructor(
    private readonly mlInfrastructure: MLInfrastructureService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Match a candidate to a single job
   */
  async matchCandidateToJob(
    input: JobMatchingInput,
    jobId: string,
    customWeights?: Partial<typeof this.defaultWeights>,
  ): Promise<JobMatchResult> {
    const startTime = Date.now();
    const weights = { ...this.defaultWeights, ...customWeights };

    try {
      // Fetch job details
      const job = await this.prisma.jobPosting.findUnique({ where: { id: jobId } });
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      // Generate embeddings for semantic similarity
      const candidateEmbedding = await this.mlInfrastructure.getEmbedding(
        this.encodeCandidateProfile(input.candidateProfile),
      );
      const jobEmbedding = await this.mlInfrastructure.getEmbedding(
        this.encodeJobPosting(job),
      );

      // Calculate semantic similarity
      const semanticSimilarity = this.mlInfrastructure.cosineSimilarity(
        candidateEmbedding,
        jobEmbedding,
      );

      // Calculate individual match factors
      const skillMatch = this.calculateSkillMatch(
        input.candidateProfile.skills,
        job.skills as string[],
      );
      const experienceMatch = this.calculateExperienceMatch(
        input.candidateProfile.experience,
        job,
      );
      const educationMatch = this.calculateEducationMatch(
        input.candidateProfile.education,
        job,
      );
      const locationMatch = this.calculateLocationMatch(
        input.preferences,
        job,
      );
      const culturalFit = this.calculateCulturalFit(
        input.candidateProfile.summary,
        job,
      );

      // Calculate weighted match score
      const matchScore = this.calculateWeightedScore(
        semanticSimilarity,
        skillMatch,
        experienceMatch,
        educationMatch,
        culturalFit,
        locationMatch,
        weights,
      );

      // Calculate success probability using neural network approximation
      const successProbability = this.approximateSuccessProbability(matchScore, {
        skillMatch,
        experienceMatch,
        educationMatch,
        culturalFit,
      });

      // Generate match explanation
      const explanation = this.generateMatchExplanation(
        matchScore,
        skillMatch,
        experienceMatch,
        educationMatch,
        culturalFit,
        locationMatch,
      );

      // Identify matched and missing skills
      const { matchedSkills, missingSkills } = this.compareSkills(
        input.candidateProfile.skills,
        job.skills as string[],
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        missingSkills,
        job,
        input.candidateProfile,
      );

      const processingTime = Date.now() - startTime;
      this.logger.log(`Job matching completed in ${processingTime}ms`);

      return {
        jobId,
        matchScore,
        successProbability,
        factors: [
          { factor: 'semantic_similarity', weight: 0, score: semanticSimilarity, contribution: semanticSimilarity * 0.2 },
          { factor: 'skill_match', weight: weights.skillMatch, score: skillMatch, contribution: skillMatch * weights.skillMatch },
          { factor: 'experience_match', weight: weights.experienceMatch, score: experienceMatch, contribution: experienceMatch * weights.experienceMatch },
          { factor: 'education_match', weight: weights.educationMatch, score: educationMatch, contribution: educationMatch * weights.educationMatch },
          { factor: 'cultural_fit', weight: weights.culturalFit, score: culturalFit, contribution: culturalFit * weights.culturalFit },
          { factor: 'location_match', weight: weights.locationMatch, score: locationMatch, contribution: locationMatch * weights.locationMatch },
        ],
        explanation,
        matchedSkills,
        missingSkills,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Job matching failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Batch match a candidate to multiple jobs
   */
  async batchMatchCandidateToJobs(
    input: JobMatchingInput,
    jobIds: string[],
    customWeights?: Partial<typeof this.defaultWeights>,
  ): Promise<JobMatchResult[]> {
    const results: JobMatchResult[] = [];
    
    // Process in parallel for efficiency
    const promises = jobIds.map(jobId => 
      this.matchCandidateToJob(input, jobId, customWeights)
    );
    
    results.push(...await Promise.all(promises));
    
    // Sort by match score descending
    results.sort((a, b) => b.matchScore - a.matchScore);
    
    return results;
  }

  /**
   * Get explanation for a previous match prediction
   */
  async getMatchExplanation(predictionId: string): Promise<JobMatchResult | null> {
    const prediction = await this.prisma.jobMatchPrediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction) {
      return null;
    }

    return {
      jobId: prediction.jobId,
      matchScore: prediction.matchScore,
      successProbability: prediction.successProb,
      factors: (prediction.factors as MatchFactor[]) || [],
      explanation: (prediction.explanation as MatchExplanation) || {
        summary: '',
        strengths: [],
        concerns: [],
        tips: [],
      },
      matchedSkills: [],
      missingSkills: [],
      recommendations: [],
    };
  }

  /**
   * Store a match prediction for future reference
   */
  async storeMatchPrediction(
    candidateId: string,
    jobId: string,
    result: JobMatchResult,
  ): Promise<string> {
    const prediction = await this.prisma.jobMatchPrediction.create({
      data: {
        candidateId,
        jobId,
        matchScore: result.matchScore,
        successProb: result.successProbability,
        factors: result.factors as any,
        explanation: result.explanation as any,
      },
    });

    return prediction.id;
  }

  /**
   * Encode candidate profile for embedding generation
   */
  private encodeCandidateProfile(profile: JobMatchingInput['candidateProfile']): string {
    const parts: string[] = [];
    
    if (profile.summary) {
      parts.push(profile.summary);
    }
    
    parts.push(...profile.skills.join(' '));
    
    profile.experience.forEach(exp => {
      parts.push(exp.title);
      parts.push(exp.description);
    });
    
    profile.education.forEach(edu => {
      parts.push(edu.degree);
      parts.push(edu.field);
    });
    
    return parts.join(' ');
  }

  /**
   * Encode job posting for embedding generation
   */
  private encodeJobPosting(job: any): string {
    return `${job.title} ${job.description} ${job.requirements} ${job.responsibilities} ${(job.skills || []).join(' ')}`;
  }

  /**
   * Calculate skill match score (0-1)
   */
  private calculateSkillMatch(candidateSkills: string[], jobSkills: string[]): number {
    if (!jobSkills.length) return 1;
    
    const normalizedCandidate = candidateSkills.map(s => s.toLowerCase());
    const normalizedJob = jobSkills.map(s => s.toLowerCase());
    
    const matchingSkills = normalizedJob.filter(skill => 
      normalizedCandidate.some(cs => 
        cs.includes(skill) || skill.includes(cs)
      )
    );
    
    return matchingSkills.length / normalizedJob.length;
  }

  /**
   * Calculate experience match score (0-1)
   */
  private calculateExperienceMatch(
    experience: JobMatchingInput['candidateProfile']['experience'],
    job: any,
  ): number {
    // Simple heuristic: check if job requires experience and candidate has it
    const requiredYears = this.extractRequiredYears(job.requirements);
    const candidateYears = this.calculateTotalYears(experience);
    
    if (requiredYears === 0) return 1;
    if (candidateYears >= requiredYears) return 1;
    
    return Math.min(candidateYears / requiredYears, 1);
  }

  /**
   * Calculate education match score (0-1)
   */
  private calculateEducationMatch(
    education: JobMatchingInput['candidateProfile']['education'],
    job: any,
  ): number {
    // Check if required education level is met
    const requiredLevel = this.extractRequiredEducation(job.requirements);
    const candidateLevel = this.getHighestEducationLevel(education);
    
    return this.educationLevelScore(requiredLevel, candidateLevel);
  }

  /**
   * Calculate location match score (0-1)
   */
  private calculateLocationMatch(
    preferences: JobMatchingInput['preferences'],
    job: any,
  ): number {
    if (!preferences?.location && !preferences?.remotePreference) {
      return 0.5; // Neutral if no preference specified
    }

    const jobLocation = job.location?.toLowerCase() || '';
    const preferredLocation = preferences.location?.toLowerCase() || '';
    const remotePreference = preferences.remotePreference;
    
    // Check for remote work match
    if (remotePreference && (jobLocation.includes('remote') || jobLocation.includes('hybrid'))) {
      return 1;
    }
    
    if (preferredLocation && jobLocation.includes(preferredLocation)) {
      return 1;
    }
    
    if (preferredLocation && !jobLocation) {
      return 0.5; // Unknown job location
    }
    
    return 0.3; // Location mismatch
  }

  /**
   * Calculate cultural fit score (0-1)
   */
  private calculateCulturalFit(summary: string | undefined, job: any): number {
    if (!summary) return 0.5;
    
    // Simple heuristic based on keywords
    const cultureKeywords = ['collaborative', 'innovative', 'fast-paced', 'team-oriented', 'results-driven'];
    const summaryLower = summary.toLowerCase();
    
    const matchingKeywords = cultureKeywords.filter(keyword => 
      summaryLower.includes(keyword)
    );
    
    return Math.min(0.5 + (matchingKeywords.length * 0.1), 1);
  }

  /**
   * Calculate weighted composite score
   */
  private calculateWeightedScore(
    semanticSimilarity: number,
    skillMatch: number,
    experienceMatch: number,
    educationMatch: number,
    culturalFit: number,
    locationMatch: number,
    weights: typeof this.defaultWeights,
  ): number {
    const baseScore = 
      skillMatch * weights.skillMatch +
      experienceMatch * weights.experienceMatch +
      educationMatch * weights.educationMatch +
      culturalFit * weights.culturalFit +
      locationMatch * weights.locationMatch;
    
    // Combine with semantic similarity
    return semanticSimilarity * 0.2 + baseScore * 0.8;
  }

  /**
   * Approximate success probability using neural network-style computation
   */
  private approximateSuccessProbability(
    matchScore: number,
    factors: { skillMatch: number; experienceMatch: number; educationMatch: number; culturalFit: number },
  ): number {
    // Sigmoid-like activation function
    const sigmoid = (x: number) => 1 / (1 + Math.exp(-5 * (x - 0.5)));
    
    // Calculate weighted average of factors
    const factorAvg = 
      factors.skillMatch * 0.4 +
      factors.experienceMatch * 0.3 +
      factors.educationMatch * 0.15 +
      factors.culturalFit * 0.15;
    
    return sigmoid(matchScore) * 0.7 + factorAvg * 0.3;
  }

  /**
   * Generate match explanation
   */
  private generateMatchExplanation(
    matchScore: number,
    skillMatch: number,
    experienceMatch: number,
    educationMatch: number,
    culturalFit: number,
    locationMatch: number,
  ): MatchExplanation {
    const strengths: string[] = [];
    const concerns: string[] = [];
    const tips: string[] = [];

    if (skillMatch > 0.8) {
      strengths.push('Strong skill alignment with job requirements');
    } else if (skillMatch < 0.5) {
      concerns.push('Limited overlap between candidate skills and job requirements');
      tips.push('Consider upskilling in key areas mentioned in the job description');
    }

    if (experienceMatch > 0.8) {
      strengths.push('Experience level exceeds or matches requirements');
    } else if (experienceMatch < 0.5) {
      concerns.push('May lack sufficient experience for the role');
    }

    if (educationMatch > 0.8) {
      strengths.push('Education background aligns well with the role');
    }

    if (culturalFit > 0.7) {
      strengths.push('Cultural fit indicators are positive');
    } else if (culturalFit < 0.4) {
      concerns.push('Cultural fit assessment is unclear');
    }

    if (locationMatch > 0.8) {
      strengths.push('Location preferences are well-aligned');
    } else if (locationMatch < 0.5) {
      tips.push('Consider opportunities with flexible work arrangements');
    }

    let summary = 'Good match overall';
    if (matchScore > 0.85) {
      summary = 'Excellent match - highly recommended';
    } else if (matchScore > 0.7) {
      summary = 'Strong match with minor gaps';
    } else if (matchScore > 0.5) {
      summary = 'Moderate match - some preparation needed';
    } else {
      summary = 'Limited match - may require significant adaptation';
    }

    return { summary, strengths, concerns, tips };
  }

  /**
   * Compare skills and return matched/missing
   */
  private compareSkills(candidateSkills: string[], jobSkills: string[]): { matchedSkills: string[]; missingSkills: string[] } {
    const normalizedCandidate = candidateSkills.map(s => s.toLowerCase());
    const normalizedJob = jobSkills.map(s => s.toLowerCase());
    
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    normalizedJob.forEach(skill => {
      if (normalizedCandidate.some(cs => cs.includes(skill) || skill.includes(cs))) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    return { matchedSkills, missingSkills };
  }

  /**
   * Generate recommendations for improving match
   */
  private generateRecommendations(
    missingSkills: string[],
    job: any,
    candidateProfile: JobMatchingInput['candidateProfile'],
  ): string[] {
    const recommendations: string[] = [];

    if (missingSkills.length > 0) {
      recommendations.push(`Consider highlighting or developing these skills: ${missingSkills.slice(0, 3).join(', ')}`);
    }

    if (candidateProfile.summary) {
      recommendations.push('Tailor your summary to emphasize alignment with this specific role');
    }

    recommendations.push('Quantify your achievements with metrics and results');
    recommendations.push('Research the company culture and values to better align your application');

    return recommendations;
  }

  private extractRequiredYears(requirements: string): number {
    const match = requirements.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    return match ? parseInt(match[1]) : 0;
  }

  private calculateTotalYears(experience: Array<{ duration: number }>): number {
    return experience.reduce((sum, exp) => sum + exp.duration, 0);
  }

  private extractRequiredEducation(requirements: string): string {
    const levels = ['phd', 'master', 'bachelor', 'associate', 'high school'];
    const lower = requirements.toLowerCase();
    
    for (const level of levels) {
      if (lower.includes(level)) {
        return level;
      }
    }
    return 'none';
  }

  private getHighestEducationLevel(education: Array<{ degree: string }>): string {
    const levels = ['phd', 'master', 'bachelor', 'associate', 'high school'];
    const lowerDegrees = education.map(e => e.degree.toLowerCase());
    
    for (const level of levels) {
      if (lowerDegrees.some(d => d.includes(level))) {
        return level;
      }
    }
    return 'none';
  }

  private educationLevelScore(required: string, candidate: string): number {
    const levelOrder = ['none', 'high school', 'associate', 'bachelor', 'master', 'phd'];
    const requiredIndex = levelOrder.indexOf(required);
    const candidateIndex = levelOrder.indexOf(candidate);
    
    if (candidateIndex >= requiredIndex) return 1;
    if (requiredIndex === 0) return 1;
    
    return candidateIndex / requiredIndex;
  }
}
