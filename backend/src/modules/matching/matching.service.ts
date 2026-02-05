import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona, ExperienceLevel } from '../../entities/persona.entity';
import { JobPosting, RemotePreference } from '../../entities/job-posting.entity';
import { UserPreferences } from '../../entities/user-preferences.entity';

/**
 * Breakdown of match score components
 */
export interface MatchScoreBreakdown {
  skills: number;
  experience: number;
  salary: number;
  location: number;
  culture: number;
  constraints: number;
}

/**
 * Result of matching a persona to a job posting
 */
export interface MatchResult {
  jobPostingId: string;
  personaId: string;
  overallScore: number;
  breakdown: MatchScoreBreakdown;
  thresholdMet: boolean;
}

/**
 * Salary range interface for flexible matching
 */
interface SalaryRangeLike {
  min?: number | null;
  max?: number | null;
}

/**
 * Flexible skill type for matching
 */
type SkillLike = string | { name?: string | null } | null | undefined;

/**
 * Weight configuration keys for match scoring
 */
type WeightKeys = keyof typeof DEFAULT_WEIGHTS;

/**
 * Default weights for match score components
 */
const DEFAULT_WEIGHTS = Object.freeze({
  skills: 0.55,
  experience: 0.2,
  salary: 0.15,
  location: 0.1,
  culture: 0,
  constraints: 0,
});

/**
 * Service for matching personas to job postings with relevance scoring
 */
@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private readonly MIN_RELEVANCE_SCORE: number;
  private readonly WEIGHTS: Readonly<Record<WeightKeys, number>>;

  /**
   * Creates a new MatchingService instance
   * @param personaRepository - Repository for personas
   * @param jobPostingRepository - Repository for job postings
   */
  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(JobPosting)
    private readonly jobPostingRepository: Repository<JobPosting>,
  ) {
    // Allow override by env without introducing ConfigService dependency.
    const envMin = parseFloat(process.env.MATCH_MIN_SCORE || '');
    this.MIN_RELEVANCE_SCORE = Number.isFinite(envMin) ? envMin : 0.75;

    this.WEIGHTS = DEFAULT_WEIGHTS;
    this.assertValidWeights(this.WEIGHTS);
  }

  /**
   * Ensures weights are valid to avoid silent scoring bugs
   * @param weights - The weight configuration to validate
   */
  private assertValidWeights(weights: Record<WeightKeys, number>): void {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    // Allow small FP error
    if (Math.abs(sum - 1) > 1e-6) {
      // If off, normalize them to sum to 1.0 defensively.
      const normalized = Object.fromEntries(
        (Object.keys(weights) as WeightKeys[]).map(k => [k, weights[k] / sum]),
      ) as Record<WeightKeys, number>;
      this.logger.warn(
        `MatchingService: weights did not sum to 1. Normalizing automatically. Original sum=${sum}`,
      );
      this.WEIGHTS = Object.freeze(normalized);
    }
  }

  async calculateMatchScore(
    personaId: string,
    jobPostingId: string,
  ): Promise<MatchResult> {
    const [persona, jobPosting] = await Promise.all([
      this.personaRepository.findOne({
        where: { id: personaId },
        relations: ['profile', 'profile.user', 'profile.user.preferences'],
      }),
      this.jobPostingRepository.findOne({ where: { id: jobPostingId } }),
    ]);

    if (!persona) {
      throw new NotFoundException(`Persona not found: ${personaId}`);
    }
    if (!jobPosting) {
      throw new NotFoundException(`Job Posting not found: ${jobPostingId}`);
    }

    return this.calculateMatchScoreForEntities(persona, jobPosting);
  }

  // Internal path to avoid redundant DB queries when caller already has entities.
  private calculateMatchScoreForEntities(
    persona: Persona,
    jobPosting: JobPosting,
  ): MatchResult {
    const breakdown = this.calculateScoreBreakdown(persona, jobPosting);
    const overallScore = this.calculateOverallScore(breakdown);

    return {
      jobPostingId: String((jobPosting as any).id),
      personaId: String((persona as any).id),
      overallScore,
      breakdown,
      thresholdMet: overallScore >= this.MIN_RELEVANCE_SCORE,
    };
  }

  private calculateScoreBreakdown(
    persona: Persona,
    jobPosting: JobPosting,
  ): MatchScoreBreakdown {
    const skillsScore = this.calculateSkillsMatch(
      (persona as any)?.skills,
      (jobPosting as any)?.skills,
    );

    // Attempt to extract a job experience representation from several likely fields.
    const jobExperienceSource =
      (jobPosting as any)?.experiences ??
      (jobPosting as any)?.experienceLevel ??
      (jobPosting as any)?.requirements ??
      (jobPosting as any)?.description ??
      (jobPosting as any)?.title ??
      jobPosting;

    const experienceScore = this.calculateExperienceMatch(
      (persona as any)?.experienceLevel,
      jobExperienceSource,
    );

    const salaryScore = this.calculateSalaryFit(
      (persona as any)?.profile?.user?.preferences ?? null,
      (jobPosting as any)?.salaryRange ?? null,
    );

    const locationScore = this.calculateLocationCompatibility(
      (persona as any)?.profile?.user?.preferences ?? null,
      ((jobPosting as any)?.location ?? '') as string,
      (jobPosting as any)?.remotePreference,
    );

    const cultureScore = this.calculateCulturalFit(
      (persona as any)?.profile?.user?.preferences ?? null,
      jobPosting,
    );

    const constraintsScore = this.calculateConstraintsCompliance(persona, jobPosting);

    return {
      skills: skillsScore * this.WEIGHTS.skills,
      experience: experienceScore * this.WEIGHTS.experience,
      salary: salaryScore * this.WEIGHTS.salary,
      location: locationScore * this.WEIGHTS.location,
      culture: cultureScore * this.WEIGHTS.culture,
      constraints: constraintsScore * this.WEIGHTS.constraints,
    };
  }

  private calculateOverallScore(breakdown: MatchScoreBreakdown): number {
    // Clamp each component and sum for safety
    const clamped = Object.values(breakdown).map(v => Math.max(0, Math.min(1, v)));
    return clamped.reduce((sum, score) => sum + score, 0);
  }

  private normalizeSkill(skill: SkillLike): string | null {
    if (typeof skill === 'string') return skill.trim().toLowerCase();
    if (!skill) return null;
    const name = (skill as any).name;
    if (typeof name === 'string') return name.trim().toLowerCase();
    return null;
  }

  private calculateSkillsMatch(
    personaSkills: SkillLike[] | undefined,
    jobSkills: SkillLike[] | undefined,
  ): number {
    const personaSkillsArray = Array.isArray(personaSkills) ? personaSkills : [];
    const jobSkillsArray = Array.isArray(jobSkills) ? jobSkills : [];

    if (jobSkillsArray.length === 0) return 1; // If job lists no skills, treat as full match.

    const personaSet = new Set(
      personaSkillsArray
        .map(s => this.normalizeSkill(s))
        .filter((s): s is string => !!s),
    );
    const jobSet = new Set(
      jobSkillsArray
        .map(s => this.normalizeSkill(s))
        .filter((s): s is string => !!s),
    );

    if (jobSet.size === 0) return 1;

    let matched = 0;
    for (const skill of jobSet) {
      if (personaSet.has(skill)) matched += 1;
    }

    return matched / jobSet.size;
  }

  private calculateExperienceMatch(
    personaLevel: ExperienceLevel | null | undefined,
    jobExperience: unknown,
  ): number {
    const levelMap: Record<ExperienceLevel, number> = {
      [ExperienceLevel.JUNIOR]: 1,
      [ExperienceLevel.MID]: 2,
      [ExperienceLevel.SENIOR]: 3,
      [ExperienceLevel.LEAD]: 4,
    } as const;

    const personaLevelValue =
      (personaLevel != null && (levelMap as any)[personaLevel]) || 2; // default neutral MID

    const jobRequiredLevel = this.extractJobExperienceLevel(jobExperience);

    if (!jobRequiredLevel) return 0.5; // neutral if unknown

    const levelDiff = Math.abs(personaLevelValue - jobRequiredLevel);
    return Math.max(0, 1 - levelDiff * 0.3);
  }

  private extractJobExperienceLevel(jobExperience: unknown): number | null {
    if (!jobExperience) return null;

    const experienceStr = JSON.stringify(jobExperience).toLowerCase();

    // Map textual hints to scale 1..4
    if (experienceStr.includes('lead')) return 4;
    if (experienceStr.includes('senior') || experienceStr.includes('principal')) return 3;
    if (experienceStr.includes('mid') || experienceStr.includes('intermediate')) return 2;
    if (experienceStr.includes('junior') || experienceStr.includes('entry')) return 1;

    // If explicit numbers like "5+ years" appear, approximate
    const yearsMatch = experienceStr.match(/(\d+)\s*\+?\s*year/);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1], 10);
      if (Number.isFinite(years)) {
        if (years >= 8) return 4; // lead
        if (years >= 5) return 3; // senior
        if (years >= 2) return 2; // mid
        return 1; // junior
      }
    }

    return null;
  }

  private calculateSalaryFit(
    userPreferences: UserPreferences | null,
    jobSalaryRange: SalaryRangeLike | null,
  ): number {
    if (!userPreferences || !jobSalaryRange) {
      return 0.5; // neutral when unknown
    }

    const userMin = Number(userPreferences.minSalary ?? 0);
    const userMaxRaw = userPreferences.maxSalary;
    const jobMin = Number(jobSalaryRange.min ?? 0);
    const jobMaxRaw = jobSalaryRange.max;

    const userMax = userMaxRaw == null ? Infinity : Number(userMaxRaw);
    const jobMax = jobMaxRaw == null ? Infinity : Number(jobMaxRaw);

    // No overlap
    const overlapStart = Math.max(userMin, jobMin);
    const overlapEnd = Math.min(userMax, jobMax);
    if (overlapStart >= overlapEnd) return 0;

    const userRange = userMax - userMin;
    const jobRange = jobMax - jobMin;
    const overlap = overlapEnd - overlapStart;

    // Handle zero or infinite ranges robustly
    const finiteRanges = [userRange, jobRange].filter(r => Number.isFinite(r) && r > 0) as number[];
    if (finiteRanges.length === 0) {
      // Both ranges are zero or unbounded - any overlap -> treat as good fit
      return 1;
    }
    const denom = Math.min(...finiteRanges);
    if (denom <= 0) return overlap > 0 ? 1 : 0;

    const ratio = overlap / denom;
    return Math.max(0, Math.min(1, ratio));
  }

  private normalizeRemotePreference(value: unknown): RemotePreference | null {
    if (value == null) return null;
    if (typeof value === 'number') return value as RemotePreference;
    if (typeof value === 'string') {
      const v = value.toLowerCase();
      if (v === 'remote') return RemotePreference.REMOTE as RemotePreference;
      if (v === 'hybrid') return RemotePreference.HYBRID as RemotePreference;
      if (v === 'onsite' || v === 'on-site' || v === 'office')
        return RemotePreference.ONSITE as RemotePreference;
    }
    return null;
  }

  private calculateLocationCompatibility(
    userPreferences: UserPreferences | null,
    jobLocation: string | null | undefined,
    remotePreference: RemotePreference | null | undefined,
  ): number {
    if (!userPreferences) return 0.5; // neutral when unknown

    const userRemote = this.normalizeRemotePreference(
      (userPreferences as any)?.remotePreference,
    );
    const jobRemote = this.normalizeRemotePreference(remotePreference);

    // If either side prefers remote, consider compatible
    if (userRemote === RemotePreference.REMOTE || jobRemote === RemotePreference.REMOTE) {
      return 1;
    }

    const userLocationRaw = (userPreferences as any)?.location ?? '';
    const userLocation = typeof userLocationRaw === 'string' ? userLocationRaw.toLowerCase().trim() : '';
    const jobLocationLower = (jobLocation ?? '').toString().toLowerCase().trim();

    if (userLocation && jobLocationLower) {
      if (
        jobLocationLower.includes(userLocation) ||
        userLocation.includes(jobLocationLower)
      ) {
        return 1;
      }
    }

    // Hybrid considered partial compatibility if not remote
    if (
      userRemote === RemotePreference.HYBRID ||
      jobRemote === RemotePreference.HYBRID
    ) {
      return 0.5;
    }

    return 0; // otherwise incompatible
  }

  private calculateCulturalFit(
    userPreferences: UserPreferences | null,
    jobPosting: JobPosting,
  ): number {
    // Minimal viable: return neutral unless we have obvious keywords on both sides.
    if (!userPreferences) return 0.5;

    const prefsText = JSON.stringify({
      // Add fields here as they exist in your schema, this is defensive only
      values: (userPreferences as any)?.preferredValues,
      culture: (userPreferences as any)?.culture,
    })
      .toLowerCase()
      .trim();

    const jobText = JSON.stringify({
      description: (jobPosting as any)?.description,
      culture: (jobPosting as any)?.culture,
      values: (jobPosting as any)?.values,
    })
      .toLowerCase()
      .trim();

    if (!prefsText || !jobText) return 0.5;

    // Very naive overlap check
    let hits = 0;
    for (const token of ['inclusive', 'fast-paced', 'collaborative', 'innovative', 'transparent']) {
      if (prefsText.includes(token) && jobText.includes(token)) hits += 1;
    }

    if (hits >= 3) return 1;
    if (hits === 2) return 0.75;
    if (hits === 1) return 0.6;
    return 0.5; // neutral otherwise
  }

  private calculateConstraintsCompliance(_persona: Persona, _jobPosting: JobPosting): number {
    // Placeholder: until implemented, return neutral rather than 1.0 to avoid skewing.
    return 0.5;
  }

  async findMatches(personaId: string): Promise<MatchResult[]> {
    // Fetch persona once to avoid N+1 queries.
    const persona = await this.personaRepository.findOne({
      where: { id: personaId },
      relations: ['profile', 'profile.user', 'profile.user.preferences'],
    });
    if (!persona) {
      throw new NotFoundException(`Persona not found: ${personaId}`);
    }

    const activeJobs = await this.jobPostingRepository.find({
      where: { isExpired: false },
    });

    const matches = activeJobs.map(job => this.calculateMatchScoreForEntities(persona, job));

    // Stable sort with tie-breaker on skills component
    return matches.sort((a, b) => {
      const diff = b.overallScore - a.overallScore;
      if (Math.abs(diff) > 1e-9) return diff;
      return b.breakdown.skills - a.breakdown.skills;
    });
  }

  async updateModelWithFeedback(matchResult: MatchResult, feedback: 'positive' | 'negative'): Promise<void> {
    if (this.shouldUpdateModel()) {
      this.performBayesianUpdate(matchResult, feedback);
    }
  }

  private shouldUpdateModel(): boolean {
    return true;
  }

  private performBayesianUpdate(_matchResult: MatchResult, _feedback: 'positive' | 'negative'): void {
    // Bayesian update placeholder implementation
  }

  // Replace randomness with deterministic logic using synthetic cases.
  async validateScoringLogic(): Promise<{ success: boolean; examples: any[] }> {
    const examples = [
      this.createValidationExample(
        {
          id: 'persona-1',
          skills: ['typescript', 'react', 'node'],
          experienceLevel: ExperienceLevel.SENIOR,
          profile: { user: { preferences: { minSalary: 120000, maxSalary: 180000, location: 'new york', remotePreference: 'hybrid' } } } as any,
        } as Persona,
        {
          id: 'job-1',
          skills: ['typescript', 'node', 'aws'],
          description: 'Senior full stack engineer in a collaborative and innovative team',
          salaryRange: { min: 130000, max: 170000 },
          location: 'New York, NY',
          remotePreference: RemotePreference.HYBRID,
          isExpired: false,
        } as any as JobPosting,
      ),
      this.createValidationExample(
        {
          id: 'persona-2',
          skills: ['html', 'css', 'javascript'],
          experienceLevel: ExperienceLevel.JUNIOR,
          profile: { user: { preferences: { minSalary: 60000, maxSalary: 90000, location: 'remote', remotePreference: 'remote' } } } as any,
        } as Persona,
        {
          id: 'job-2',
          skills: ['javascript', 'css'],
          description: 'Entry level frontend developer role. Collaborative culture.',
          salaryRange: { min: 65000, max: 80000 },
          location: 'Remote',
          remotePreference: RemotePreference.REMOTE,
          isExpired: false,
        } as any as JobPosting,
      ),
      this.createValidationExample(
        {
          id: 'persona-3',
          skills: ['sql', 'project management'],
          experienceLevel: ExperienceLevel.MID,
          profile: { user: { preferences: { minSalary: 100000, maxSalary: 120000, location: 'austin', remotePreference: 'onsite' } } } as any,
        } as Persona,
        {
          id: 'job-3',
          skills: ['project management', 'excel'],
          description: 'Product manager, mid level, transparent culture',
          salaryRange: { min: 95000, max: 125000 },
          location: 'Austin, TX',
          remotePreference: RemotePreference.ONSITE,
          isExpired: false,
        } as any as JobPosting,
      ),
    ];

    const allValid = examples.every(example => example.score >= this.MIN_RELEVANCE_SCORE);

    return {
      success: allValid,
      examples,
    };
  }

  private createValidationExample(persona: Persona, job: JobPosting): any {
    const breakdown = this.calculateScoreBreakdown(persona, job);
    const score = this.calculateOverallScore(breakdown);
    return {
      personaId: (persona as any).id,
      jobPostingId: (job as any).id,
      breakdown,
      score,
    };
  }

  getSpamChecklist(): string[] {
    return [
      'Keyword stuffing detection',
      'Irrelevant skill matching',
      'Experience mismatch check',
      'Location incompatibility',
      'Salary range mismatch',
      'Company blacklist',
    ];
  }

  getEvaluationPlan(): any {
    return {
      abTesting: {
        variants: ['Control', 'Experimental'],
        metrics: ['Match quality', 'Application success rate', 'User satisfaction'],
        duration: '4 weeks',
      },
      offlineEvaluation: {
        datasetSize: '1000 candidate-job pairs',
        metrics: ['Precision', 'Recall', 'F1 score'],
      },
      errorAnalysis: {
        categories: ['False positives', 'False negatives', 'Score calibration'],
      },
    };
  }

  getAssumptionsForHumanReview(): string[] {
    return [
      'Skills matching relies on keyword matching, not semantic understanding',
      'Experience level is inferred from text analysis, not structured data',
      'Salary fit calculations handle open-ended and zero-width ranges defensively',
      'Location compatibility is based on city/region matching and remote/hybrid normalization',
      'Cultural fit uses minimal keyword overlap and carries zero weight by default',
      'Constraints compliance returns neutral until implemented',
    ];
  }
}
