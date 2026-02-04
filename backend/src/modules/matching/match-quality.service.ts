import { Injectable, Logger } from '@nestjs/common';
import { Persona } from '../../entities/persona.entity';
import { JobPosting } from '../../entities/job-posting.entity';
import { EmbeddingService } from './embedding.service';
import { CulturalFitService, CulturalFitScore } from './cultural-fit.service';
import { CareerTrajectoryService } from './career-trajectory.service';
import { LearningToRankService } from './learning-to-rank.service';

export interface MatchQualityExplanation {
  overallScore: number;
  scoreBand: 'excellent' | 'good' | 'moderate' | 'poor';
  summary: string;
  strengths: MatchStrength[];
  weaknesses: MatchWeakness[];
  skillAnalysis: SkillAnalysis;
  experienceAnalysis: ExperienceAnalysis;
  cultureAnalysis: CultureAnalysis;
  careerAnalysis: CareerAnalysis;
  recommendations: string[];
  questionsToAsk: string[];
  redFlags: string[];
  greenFlags: string[];
}

export interface MatchStrength {
  category: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  evidence: string;
}

export interface MatchWeakness {
  category: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  mitigation?: string;
}

export interface SkillAnalysis {
  matchedSkills: string[];
  missingSkills: string[];
  bonusSkills: string[];
  skillMatchScore: number;
  recommendations: string[];
}

export interface ExperienceAnalysis {
  levelMatch: 'perfect' | 'good' | 'acceptable' | 'mismatch';
  yearsExperience: { required: number; actual: number };
  domainExpertise: string;
  gapAnalysis: string;
}

export interface CultureAnalysis {
  score: number;
  matchedValues: string[];
  misalignedValues: string[];
  workStyleFit: string;
  recommendations: string[];
}

export interface CareerAnalysis {
  trajectoryScore: number;
  nextRole: string;
  salaryGrowth: number;
  growthPotential: 'high' | 'medium' | 'low';
  recommendations: string[];
}

@Injectable()
export class MatchQualityService {
  private readonly logger = new Logger(MatchQualityService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly culturalFitService: CulturalFitService,
    private readonly careerTrajectoryService: CareerTrajectoryService,
    private readonly ltrService: LearningToRankService,
  ) {}

  /**
   * Generate comprehensive match quality explanation
   */
  async explainMatch(
    persona: Persona,
    jobPosting: JobPosting,
    ltrResult?: any,
  ): Promise<MatchQualityExplanation> {
    // Calculate all analysis components
    const [skillAnalysis, experienceAnalysis, cultureAnalysis, careerAnalysis] = await Promise.all([
      this.analyzeSkills(persona, jobPosting),
      this.analyzeExperience(persona, jobPosting),
      this.analyzeCulture(persona, jobPosting),
      this.analyzeCareer(persona, jobPosting),
    ]);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      skillAnalysis,
      experienceAnalysis,
      cultureAnalysis,
      careerAnalysis,
      ltrResult,
    );

    // Determine score band
    const scoreBand = this.getScoreBand(overallScore);

    // Generate strengths and weaknesses
    const { strengths, weaknesses } = this.analyzeStrengthsAndWeaknesses(
      skillAnalysis,
      experienceAnalysis,
      cultureAnalysis,
      careerAnalysis,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      skillAnalysis,
      experienceAnalysis,
      cultureAnalysis,
      careerAnalysis,
    );

    // Generate questions to ask
    const questionsToAsk = this.generateQuestionsToAsk(
      skillAnalysis,
      experienceAnalysis,
      cultureAnalysis,
      careerAnalysis,
    );

    // Identify red and green flags
    const { redFlags, greenFlags } = this.identifyFlags(
      skillAnalysis,
      experienceAnalysis,
      cultureAnalysis,
      careerAnalysis,
    );

    return {
      overallScore,
      scoreBand,
      summary: this.generateSummary(overallScore, scoreBand, strengths.length, weaknesses.length),
      strengths,
      weaknesses,
      skillAnalysis,
      experienceAnalysis,
      cultureAnalysis,
      careerAnalysis,
      recommendations,
      questionsToAsk,
      redFlags,
      greenFlags,
    };
  }

  /**
   * Analyze skills match
   */
  private async analyzeSkills(
    persona: Persona,
    jobPosting: JobPosting,
  ): Promise<SkillAnalysis> {
    const personaSkills = ((persona.skills as any[]) || []).map(
      s => typeof s === 'string' ? s : s.name || '',
    );
    const jobSkills = ((jobPosting.skills as any[]) || []).map(
      s => typeof s === 'string' ? s : s.name || '',
    );

    const personaSkillSet = new Set(personaSkills.map(s => s.toLowerCase()));
    const jobSkillSet = new Set(jobSkills.map(s => s.toLowerCase()));

    // Find matched skills
    const matchedSkills = jobSkills.filter(skill =>
      personaSkillSet.has(skill.toLowerCase()),
    );

    // Find missing skills
    const missingSkills = jobSkills.filter(skill =>
      !personaSkillSet.has(skill.toLowerCase()),
    );

    // Find bonus skills (skills persona has that aren't required)
    const bonusSkills = personaSkills.filter(skill =>
      !jobSkillSet.has(skill.toLowerCase()),
    );

    // Calculate skill match score
    const skillMatchScore = jobSkills.length > 0
      ? matchedSkills.length / jobSkills.length
      : 0.5;

    // Semantic analysis
    const semanticResult = await this.embeddingService.analyzeSkillsSemantically(
      personaSkills,
      jobSkills,
    );

    return {
      matchedSkills,
      missingSkills,
      bonusSkills: bonusSkills.slice(0, 5),
      skillMatchScore: (skillMatchScore + semanticResult.score) / 2,
      recommendations: this.generateSkillRecommendations(missingSkills, bonusSkills),
    };
  }

  /**
   * Analyze experience match
   */
  private async analyzeExperience(
    persona: Persona,
    jobPosting: JobPosting,
  ): Promise<ExperienceAnalysis> {
    const levelMap: Record<string, number> = {
      'JUNIOR': 1,
      'MID': 2,
      'SENIOR': 3,
      'LEAD': 4,
    };

    const personaLevelNum = levelMap[persona.experienceLevel?.toString() || 'MID'] || 2;
    const requiredLevel = this.extractRequiredLevel(jobPosting);

    let levelMatch: 'perfect' | 'good' | 'acceptable' | 'mismatch';
    if (personaLevelNum === requiredLevel) {
      levelMatch = 'perfect';
    } else if (Math.abs(personaLevelNum - requiredLevel) <= 1) {
      levelMatch = 'good';
    } else if (Math.abs(personaLevelNum - requiredLevel) <= 2) {
      levelMatch = 'acceptable';
    } else {
      levelMatch = 'mismatch';
    }

    // Infer domain expertise from job description
    const domainExpertise = this.inferDomainExpertise(jobPosting);

    // Gap analysis
    const gapAnalysis = this.generateExperienceGapAnalysis(
      persona.experienceLevel,
      jobPosting.experiences,
    );

    return {
      levelMatch,
      yearsExperience: { required: requiredLevel * 2, actual: personaLevelNum * 2 },
      domainExpertise,
      gapAnalysis,
    };
  }

  /**
   * Analyze cultural fit
   */
  private async analyzeCulture(
    persona: Persona,
    jobPosting: JobPosting,
  ): Promise<CultureAnalysis> {
    // Simplified cultural analysis without user preferences
    const description = jobPosting.description.toLowerCase();

    const matchedValues: string[] = [];
    const misalignedValues: string[] = [];

    // Check for common cultural indicators
    const culturalIndicators = [
      { name: 'Collaboration', keywords: ['team', 'collaborative', 'cross-functional'] },
      { name: 'Innovation', keywords: ['innovative', 'cutting-edge', 'experiment'] },
      { name: 'Work-Life Balance', keywords: ['flexible', 'remote', 'balance'] },
      { name: 'Growth', keywords: ['growth', 'development', 'learning'] },
      { name: 'Transparency', keywords: ['transparent', 'open', 'honest'] },
    ];

    for (const indicator of culturalIndicators) {
      const match = indicator.keywords.some(kw => description.includes(kw));
      if (match) {
        matchedValues.push(indicator.name);
      }
    }

    // Calculate score
    const score = matchedValues.length / culturalIndicators.length;

    // Work style fit (simplified)
    const workStyleFit = jobPosting.remotePreference === 'REMOTE'
      ? 'Remote-friendly environment'
      : jobPosting.remotePreference === 'HYBRID'
      ? 'Hybrid work model'
      : 'On-site expected';

    return {
      score,
      matchedValues,
      misalignedValues,
      workStyleFit,
      recommendations: this.generateCultureRecommendations(matchedValues),
    };
  }

  /**
   * Analyze career trajectory
   */
  private async analyzeCareer(
    persona: Persona,
    jobPosting: JobPosting,
  ): Promise<CareerAnalysis> {
    const trajectory = await this.careerTrajectoryService.predictTrajectory(
      persona,
      jobPosting,
    );

    return {
      trajectoryScore: trajectory.trajectoryScore,
      nextRole: trajectory.nextRole,
      salaryGrowth: trajectory.salaryProjection.growth,
      growthPotential: trajectory.growthPotential,
      recommendations: trajectory.recommendations,
    };
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(
    skillAnalysis: SkillAnalysis,
    experienceAnalysis: ExperienceAnalysis,
    cultureAnalysis: CultureAnalysis,
    careerAnalysis: CareerAnalysis,
    ltrResult?: any,
  ): number {
    // Weight different factors
    const weights = {
      skills: 0.35,
      experience: 0.25,
      culture: 0.20,
      career: 0.20,
    };

    const experienceScore = experienceAnalysis.levelMatch === 'perfect' ? 1 :
      experienceAnalysis.levelMatch === 'good' ? 0.8 :
      experienceAnalysis.levelMatch === 'acceptable' ? 0.6 : 0.3;

    const careerScore = careerAnalysis.trajectoryScore;

    return (
      weights.skills * skillAnalysis.skillMatchScore +
      weights.experience * experienceScore +
      weights.culture * cultureAnalysis.score +
      weights.career * careerScore
    );
  }

  /**
   * Get score band
   */
  private getScoreBand(score: number): 'excellent' | 'good' | 'moderate' | 'poor' {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'moderate';
    return 'poor';
  }

  /**
   * Analyze strengths and weaknesses
   */
  private analyzeStrengthsAndWeaknesses(
    skillAnalysis: SkillAnalysis,
    experienceAnalysis: ExperienceAnalysis,
    cultureAnalysis: CultureAnalysis,
    careerAnalysis: CareerAnalysis,
  ): { strengths: MatchStrength[]; weaknesses: MatchWeakness[] } {
    const strengths: MatchStrength[] = [];
    const weaknesses: MatchWeakness[] = [];

    // Skills strengths
    if (skillAnalysis.skillMatchScore > 0.7) {
      strengths.push({
        category: 'Skills',
        description: 'Strong skills alignment',
        impact: 'high',
        evidence: `${skillAnalysis.matchedSkills.length} required skills matched`,
      });
    }

    // Experience strengths
    if (experienceAnalysis.levelMatch === 'perfect' || experienceAnalysis.levelMatch === 'good') {
      strengths.push({
        category: 'Experience',
        description: 'Experience level matches requirements',
        impact: 'high',
        evidence: `Level: ${experienceAnalysis.levelMatch}`,
      });
    }

    // Culture strengths
    if (cultureAnalysis.matchedValues.length > 2) {
      strengths.push({
        category: 'Culture',
        description: 'Cultural values align with company',
        impact: 'medium',
        evidence: `Matched values: ${cultureAnalysis.matchedValues.join(', ')}`,
      });
    }

    // Career strengths
    if (careerAnalysis.growthPotential === 'high') {
      strengths.push({
        category: 'Career',
        description: 'High growth potential',
        impact: 'high',
        evidence: `Next role: ${careerAnalysis.nextRole}`,
      });
    }

    // Skills weaknesses
    if (skillAnalysis.missingSkills.length > 2) {
      weaknesses.push({
        category: 'Skills',
        description: `Missing ${skillAnalysis.missingSkills.length} required skills`,
        impact: 'high',
        mitigation: `Consider upskilling in: ${skillAnalysis.missingSkills.slice(0, 3).join(', ')}`,
      });
    }

    // Experience weaknesses
    if (experienceAnalysis.levelMatch === 'mismatch') {
      weaknesses.push({
        category: 'Experience',
        description: 'Experience level may not match',
        impact: 'high',
        mitigation: experienceAnalysis.gapAnalysis,
      });
    }

    return { strengths, weaknesses };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    skillAnalysis: SkillAnalysis,
    experienceAnalysis: ExperienceAnalysis,
    cultureAnalysis: CultureAnalysis,
    careerAnalysis: CareerAnalysis,
  ): string[] {
    const recommendations: string[] = [];

    // Skill recommendations
    if (skillAnalysis.missingSkills.length > 0) {
      recommendations.push(
        `Focus on learning: ${skillAnalysis.missingSkills.slice(0, 3).join(', ')}`,
      );
    }

    // Experience recommendations
    if (experienceAnalysis.levelMatch !== 'perfect') {
      recommendations.push(experienceAnalysis.gapAnalysis);
    }

    // Culture recommendations
    if (cultureAnalysis.matchedValues.length < 2) {
      recommendations.push(
        'Ask about company values and work culture during interview',
      );
    }

    // Career recommendations
    recommendations.push(...careerAnalysis.recommendations.slice(0, 2));

    return recommendations;
  }

  /**
   * Generate questions to ask
   */
  private generateQuestionsToAsk(
    skillAnalysis: SkillAnalysis,
    experienceAnalysis: ExperienceAnalysis,
    cultureAnalysis: CultureAnalysis,
    careerAnalysis: CareerAnalysis,
  ): string[] {
    const questions: string[] = [];

    if (skillAnalysis.missingSkills.length > 0) {
      questions.push(
        `What training or support is available for learning ${skillAnalysis.missingSkills[0]}?`,
      );
    }

    if (careerAnalysis.growthPotential === 'high') {
      questions.push('What does career progression look like in this role?');
    }

    if (cultureAnalysis.matchedValues.length < 2) {
      questions.push('How would you describe the company culture here?');
    }

    questions.push('What are the biggest challenges the team is facing?');
    questions.push('What success looks like in this role?');

    return questions;
  }

  /**
   * Identify red and green flags
   */
  private identifyFlags(
    skillAnalysis: SkillAnalysis,
    experienceAnalysis: ExperienceAnalysis,
    cultureAnalysis: CultureAnalysis,
    careerAnalysis: CareerAnalysis,
  ): { redFlags: string[]; greenFlags: string[] } {
    const redFlags: string[] = [];
    const greenFlags: string[] = [];

    // Red flags
    if (skillAnalysis.skillMatchScore < 0.3) {
      redFlags.push('Significant skill gaps');
    }

    if (experienceAnalysis.levelMatch === 'mismatch') {
      redFlags.push('Experience level mismatch');
    }

    if (careerAnalysis.salaryGrowth < 0) {
      redFlags.push('Potential salary decrease');
    }

    // Green flags
    if (skillAnalysis.skillMatchScore > 0.8) {
      greenFlags.push('Excellent skills alignment');
    }

    if (careerAnalysis.growthPotential === 'high') {
      greenFlags.push('Strong growth opportunities');
    }

    if (cultureAnalysis.matchedValues.length > 3) {
      greenFlags.push('Good cultural fit indicators');
    }

    return { redFlags, greenFlags };
  }

  /**
   * Generate summary
   */
  private generateSummary(
    score: number,
    band: string,
    strengthsCount: number,
    weaknessesCount: number,
  ): string {
    const scorePercent = Math.round(score * 100);
    return `This job has an overall match score of ${scorePercent}% (${band}). ` +
      `Found ${strengthsCount} strengths and ${weaknessesCount} areas to consider. ` +
      (score >= 0.8 || score >= 0.6
        ? 'This appears to be a good match overall.'
        : score >= 0.4
        ? 'There are some considerations before applying.'
        : 'You may want to explore other opportunities.');
  }

  /**
   * Extract required level from job
   */
  private extractRequiredLevel(jobPosting: JobPosting): number {
    const title = jobPosting.title.toLowerCase();
    const description = jobPosting.description.toLowerCase();

    if (title.includes('junior') || title.includes('entry')) return 1;
    if (title.includes('senior') || title.includes('staff')) return 3;
    if (title.includes('lead') || title.includes('principal') || title.includes('director')) return 4;
    if (description.includes('5+ years') || description.includes('7+ years')) return 3;
    if (description.includes('3+ years') || description.includes('5+ years')) return 2;
    if (description.includes('1+ years') || description.includes('2+ years')) return 1;

    return 2; // Default to mid-level
  }

  /**
   * Infer domain expertise from job
   */
  private inferDomainExpertise(jobPosting: JobPosting): string {
    const description = jobPosting.description.toLowerCase();

    const domains = [
      { name: 'Frontend', keywords: ['react', 'vue', 'angular', 'frontend', 'ui'] },
      { name: 'Backend', keywords: ['node', 'python', 'java', 'backend', 'api'] },
      { name: 'DevOps', keywords: ['docker', 'kubernetes', 'ci/cd', 'devops', 'cloud'] },
      { name: 'Data', keywords: ['data', 'ml', 'machine learning', 'analytics', 'sql'] },
      { name: 'Mobile', keywords: ['ios', 'android', 'react native', 'mobile', 'swift'] },
    ];

    for (const domain of domains) {
      if (domain.keywords.some(kw => description.includes(kw))) {
        return domain.name;
      }
    }

    return 'General Software Development';
  }

  /**
   * Generate experience gap analysis
   */
  private generateExperienceGapAnalysis(
    personaLevel: any,
    jobExperience: any,
  ): string {
    const levelMap: Record<string, string> = {
      'JUNIOR': 'junior-level',
      'MID': 'mid-level',
      'SENIOR': 'senior-level',
      'LEAD': 'lead-level',
    };

    return `Your ${levelMap[personaLevel?.toString() || 'MID']} experience should be relevant. ` +
      'Highlight transferable skills and relevant projects in your application.';
  }

  /**
   * Generate skill recommendations
   */
  private generateSkillRecommendations(
    missingSkills: string[],
    bonusSkills: string[],
  ): string[] {
    const recommendations: string[] = [];

    if (missingSkills.length > 0) {
      recommendations.push(
        `Consider learning: ${missingSkills.slice(0, 3).join(', ')}`,
      );
    }

    if (bonusSkills.length > 0) {
      recommendations.push(
        `Highlight your ${bonusSkills[0]} skills as a bonus`,
      );
    }

    return recommendations;
  }

  /**
   * Generate culture recommendations
   */
  private generateCultureRecommendations(matchedValues: string[]): string[] {
    const recommendations: string[] = [];

    if (matchedValues.includes('Collaboration')) {
      recommendations.push('Emphasize teamwork experiences in your application');
    }

    if (matchedValues.includes('Innovation')) {
      recommendations.push('Share examples of innovative solutions you\'ve created');
    }

    return recommendations;
  }
}
