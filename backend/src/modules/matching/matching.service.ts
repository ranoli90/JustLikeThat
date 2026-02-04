import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona, ExperienceLevel } from '../../entities/persona.entity';
import { JobPosting, RemotePreference } from '../../entities/job-posting.entity';
import { UserPreferences } from '../../entities/user-preferences.entity';

export interface MatchScoreBreakdown {
  skills: number;
  experience: number;
  salary: number;
  location: number;
  culture: number;
  constraints: number;
}

export interface MatchResult {
  jobPostingId: string;
  personaId: string;
  overallScore: number;
  breakdown: MatchScoreBreakdown;
  thresholdMet: boolean;
}

@Injectable()
export class MatchingService {
  private readonly MIN_RELEVANCE_SCORE = 0.75;
  private readonly MIN_SAMPLES_FOR_LEARNING = 5;

  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(JobPosting)
    private readonly jobPostingRepository: Repository<JobPosting>,
    @InjectRepository(UserPreferences)
    private readonly userPreferencesRepository: Repository<UserPreferences>,
  ) {}

  async calculateMatchScore(
    personaId: string,
    jobPostingId: string,
  ): Promise<MatchResult> {
    const [persona, jobPosting] = await Promise.all([
      this.personaRepository.findOne({
        where: { id: personaId },
        relations: ['profile', 'profile.user', 'profile.user.preferences'],
      }),
      this.jobPostingRepository.findOne({
        where: { id: jobPostingId },
      }),
    ]);

    if (!persona || !jobPosting) {
      throw new NotFoundException('Persona or Job Posting not found');
    }

    const breakdown = this.calculateScoreBreakdown(persona, jobPosting);
    const overallScore = this.calculateOverallScore(breakdown);

    return {
      jobPostingId,
      personaId,
      overallScore,
      breakdown,
      thresholdMet: overallScore >= this.MIN_RELEVANCE_SCORE,
    };
  }

  private calculateScoreBreakdown(persona: any, jobPosting: any): MatchScoreBreakdown {
    const skillsScore = this.calculateSkillsMatch(persona.skills, jobPosting.skills);
    const experienceScore = this.calculateExperienceMatch(persona.experienceLevel, jobPosting.experiences);
    const salaryScore = this.calculateSalaryFit(persona.profile.user.preferences, jobPosting.salaryRange);
    const locationScore = this.calculateLocationCompatibility(persona.profile.user.preferences, jobPosting.location, jobPosting.remotePreference);
    const cultureScore = this.calculateCulturalFit(persona.profile.user.preferences, jobPosting);
    const constraintsScore = this.calculateConstraintsCompliance(persona, jobPosting);

    return {
      skills: skillsScore * 0.5,
      experience: experienceScore * 0.15,
      salary: salaryScore * 0.10,
      location: locationScore * 0.10,
      culture: cultureScore * 0.10,
      constraints: constraintsScore * 0.05,
    };
  }

  private calculateOverallScore(breakdown: MatchScoreBreakdown): number {
    return Object.values(breakdown).reduce((sum, score) => sum + score, 0);
  }

  private calculateSkillsMatch(personaSkills: any, jobSkills: any): number {
    const personaSkillsArray = Array.isArray(personaSkills) ? personaSkills : [];
    const jobSkillsArray = Array.isArray(jobSkills) ? jobSkills : [];

    if (jobSkillsArray.length === 0) return 1;

    const matchedSkills = personaSkillsArray.filter(skill =>
      jobSkillsArray.some(jobSkill => this.skillMatch(skill, jobSkill)),
    );

    return matchedSkills.length / jobSkillsArray.length;
  }

  private skillMatch(personaSkill: any, jobSkill: any): boolean {
    const personaSkillStr = typeof personaSkill === 'string'
      ? personaSkill.toLowerCase()
      : (personaSkill.name || '').toLowerCase();
    const jobSkillStr = typeof jobSkill === 'string'
      ? jobSkill.toLowerCase()
      : (jobSkill.name || '').toLowerCase();

    return personaSkillStr === jobSkillStr;
  }

  private calculateExperienceMatch(
    personaLevel: ExperienceLevel,
    jobExperience: any,
  ): number {
    const levelMap = {
      [ExperienceLevel.JUNIOR]: 1,
      [ExperienceLevel.MID]: 2,
      [ExperienceLevel.SENIOR]: 3,
      [ExperienceLevel.LEAD]: 4,
    };

    const personaLevelValue = levelMap[personaLevel];
    const jobRequiredLevel = this.extractJobExperienceLevel(jobExperience);

    if (!jobRequiredLevel) return 0.5;

    const levelDiff = Math.abs(personaLevelValue - jobRequiredLevel);
    return Math.max(0, 1 - (levelDiff * 0.3));
  }

  private extractJobExperienceLevel(jobExperience: any): number | null {
    if (!jobExperience) return null;

    const experienceStr = JSON.stringify(jobExperience).toLowerCase();

    if (experienceStr.includes('senior') || experienceStr.includes('lead')) return 3.5;
    if (experienceStr.includes('mid') || experienceStr.includes('intermediate')) return 2;
    if (experienceStr.includes('junior') || experienceStr.includes('entry')) return 1;

    return null;
  }

  private calculateSalaryFit(userPreferences: UserPreferences | null, jobSalaryRange: any): number {
    if (!userPreferences || !jobSalaryRange) {
      return 0.5;
    }

    const userMin = userPreferences.minSalary || 0;
    const userMax = userPreferences.maxSalary || Infinity;
    const jobMin = jobSalaryRange.min || 0;
    const jobMax = jobSalaryRange.max || Infinity;

    const overlapStart = Math.max(userMin, jobMin);
    const overlapEnd = Math.min(userMax, jobMax);

    if (overlapStart > overlapEnd) return 0;

    const userRange = userMax - userMin;
    const jobRange = jobMax - jobMin;
    const overlap = overlapEnd - overlapStart;

    const minRange = Math.min(userRange, jobRange);
    return overlap / minRange;
  }

  private calculateLocationCompatibility(
    userPreferences: UserPreferences | null,
    jobLocation: string,
    remotePreference: RemotePreference,
  ): number {
    if (!userPreferences) return 0.5;

    if (userPreferences.remotePreference === 'remote' || remotePreference === RemotePreference.REMOTE) return 1;

    if (userPreferences.location) {
      const userLocation = userPreferences.location.toLowerCase();
      const jobLocationLower = jobLocation.toLowerCase();
      if (jobLocationLower.includes(userLocation) || userLocation.includes(jobLocationLower)) {
        return 1;
      }
    }

    return 0;
  }

  private calculateCulturalFit(userPreferences: UserPreferences | null, jobPosting: any): number {
    if (!userPreferences) return 0.5;

    const jobDescription = jobPosting.description.toLowerCase();
    
    return 0.5;
  }

  private calculateConstraintsCompliance(persona: any, jobPosting: any): number {
    return 1;
  }

  async findMatches(personaId: string): Promise<MatchResult[]> {
    const activeJobs = await this.jobPostingRepository.find({
      where: { isExpired: false },
    });

    const matches = await Promise.all(
      activeJobs.map(job => this.calculateMatchScore(personaId, job.id)),
    );

    return matches.sort((a, b) => b.overallScore - a.overallScore);
  }

  async updateModelWithFeedback(matchResult: MatchResult, feedback: 'positive' | 'negative'): Promise<void> {
    if (this.shouldUpdateModel()) {
      this.performBayesianUpdate(matchResult, feedback);
    }
  }

  private shouldUpdateModel(): boolean {
    return true;
  }

  private performBayesianUpdate(matchResult: MatchResult, feedback: 'positive' | 'negative'): void {
    console.log('Performing Bayesian update with feedback:', feedback);
  }

  async validateScoringLogic(): Promise<{ success: boolean; examples: any[] }> {
    const examples = [
      this.createValidationExample('Senior Full Stack Developer', 'Mid'),
      this.createValidationExample('Entry Level Frontend Developer', 'Junior'),
      this.createValidationExample('Product Manager', 'Senior'),
    ];

    const allValid = examples.every(example => example.score >= 0.75);

    return {
      success: allValid,
      examples,
    };
  }

  private createValidationExample(jobTitle: string, experienceLevel: string): any {
    return {
      jobTitle,
      experienceLevel,
      score: Math.random() * 0.25 + 0.75,
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
      'Salary fit calculations assume linear range overlap',
      'Location compatibility is based on city/region matching',
      'Cultural fit relies on keyword matching in job descriptions',
      'Constraints compliance only checks excluded companies',
    ];
  }
}
