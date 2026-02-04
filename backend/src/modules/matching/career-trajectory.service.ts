import { Injectable, Logger } from '@nestjs/common';
import { Persona, ExperienceLevel } from '../../entities/persona.entity';
import { JobPosting } from '../../entities/job-posting.entity';

export interface CareerTrajectoryPrediction {
  trajectoryScore: number;
  growthPotential: 'high' | 'medium' | 'low';
  nextRole: string;
  salaryProjection: {
    current: number;
    nextRole: number;
    growth: number;
  };
  skillGap: SkillGapAnalysis;
  recommendations: string[];
  timeline: string;
}

export interface SkillGapAnalysis {
  missingSkills: string[];
  recommendedSkills: string[];
  transferableSkills: string[];
  skillPriority: { skill: string; priority: 'high' | 'medium' | 'low' }[];
}

export interface ExperiencePath {
  level: ExperienceLevel;
  yearsExperience: number;
  typicalRoles: string[];
  salaryRange: { min: number; max: number };
  keySkills: string[];
}

@Injectable()
export class CareerTrajectoryService {
  private readonly logger = new Logger(CareerTrajectoryService.name);

  // Experience level mapping
  private readonly EXPERIENCE_PATHS: Record<ExperienceLevel, ExperiencePath> = {
    [ExperienceLevel.JUNIOR]: {
      level: ExperienceLevel.JUNIOR,
      yearsExperience: 0,
      typicalRoles: ['Junior Developer', 'Associate', 'Entry Level'],
      salaryRange: { min: 50000, max: 75000 },
      keySkills: ['Fundamentals', 'Learning', 'Collaboration'],
    },
    [ExperienceLevel.MID]: {
      level: ExperienceLevel.MID,
      yearsExperience: 2,
      typicalRoles: ['Software Engineer', 'Developer', 'Specialist'],
      salaryRange: { min: 75000, max: 120000 },
      keySkills: ['Independent Work', 'Mentoring', 'Project Delivery'],
    },
    [ExperienceLevel.SENIOR]: {
      level: ExperienceLevel.SENIOR,
      yearsExperience: 5,
      typicalRoles: ['Senior Engineer', 'Lead Developer', 'Staff Engineer'],
      salaryRange: { min: 120000, max: 180000 },
      keySkills: ['Architecture', 'Leadership', 'Technical Strategy'],
    },
    [ExperienceLevel.LEAD]: {
      level: ExperienceLevel.LEAD,
      yearsExperience: 8,
      typicalRoles: ['Principal Engineer', 'Engineering Manager', 'Director'],
      salaryRange: { min: 180000, max: 300000 },
      keySkills: ['People Management', 'Strategic Planning', 'Organization Design'],
    },
  };

  // Skill progression for career growth
  private readonly SKILL_PROGRESSION: Record<string, string[]> = {
    'JavaScript': ['TypeScript', 'React', 'Node.js', 'Full-stack'],
    'Python': ['Django', 'Machine Learning', 'Data Science', 'AI'],
    'Java': ['Spring Boot', 'Microservices', 'Cloud Architecture', 'System Design'],
    'SQL': ['Database Design', 'Performance Optimization', 'Data Engineering', 'Analytics'],
    'Frontend': ['React', 'Vue.js', 'Angular', 'Web Performance', 'UX Design'],
    'Backend': ['Node.js', 'Python', 'Java', 'Go', 'System Design', 'APIs'],
    'DevOps': ['Docker', 'Kubernetes', 'CI/CD', 'Cloud Infrastructure', 'SRE'],
    'Data': ['Machine Learning', 'Data Science', 'Big Data', 'Analytics', 'AI'],
  };

  // Industry growth indicators
  private readonly GROWTH_INDUSTRIES = [
    'ai', 'machine learning', 'data science', 'cloud', 'devops',
    'cybersecurity', 'blockchain', 'web3', 'fintech', 'healthtech',
  ];

  constructor() {}

  /**
   * Predict career trajectory for a persona based on job posting
   */
  async predictTrajectory(
    persona: Partial<Persona>,
    jobPosting: JobPosting,
  ): Promise<CareerTrajectoryPrediction> {
    const currentLevel = persona.experienceLevel || ExperienceLevel.MID;
    const currentSkills = this.extractSkills(persona.skills);
    const jobSkills = this.extractSkills(jobPosting.skills);
    const jobTitle = jobPosting.title.toLowerCase();
    const jobDescription = jobPosting.description.toLowerCase();

    // Analyze growth potential
    const growthPotential = this.analyzeGrowthPotential(jobPosting);
    
    // Determine next role
    const nextRole = this.predictNextRole(currentLevel, jobTitle);
    
    // Calculate salary projection
    const salaryProjection = this.calculateSalaryProjection(currentLevel, jobPosting);
    
    // Analyze skill gaps
    const skillGap = this.analyzeSkillGap(currentSkills, jobSkills, currentLevel);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(persona, jobPosting, skillGap);
    
    // Determine timeline
    const timeline = this.estimateTimeline(currentLevel, nextRole);

    const trajectoryScore = this.calculateTrajectoryScore(
      growthPotential,
      skillGap,
      salaryProjection.growth,
    );

    return {
      trajectoryScore,
      growthPotential,
      nextRole,
      salaryProjection,
      skillGap,
      recommendations,
      timeline,
    };
  }

  /**
   * Analyze growth potential of a role/company
   */
  private analyzeGrowthPotential(jobPosting: JobPosting): 'high' | 'medium' | 'low' {
    const description = jobPosting.description.toLowerCase();
    const title = jobPosting.title.toLowerCase();

    let score = 0;

    // Check for growth indicators
    const growthIndicators = [
      'growth', 'scaling', 'expansion', 'series', 'ipo', 'unicorn',
      'leadership', 'mentorship', 'ownership', 'strategic',
      'impact', 'scale', 'millions of users', 'global',
    ];

    for (const indicator of growthIndicators) {
      if (description.includes(indicator) || title.includes(indicator)) {
        score += 1;
      }
    }

    // Check for growth industries
    for (const industry of this.GROWTH_INDUSTRIES) {
      if (description.includes(industry)) {
        score += 2;
      }
    }

    // Check for senior/lead indicators
    if (title.includes('senior') || title.includes('lead') || title.includes('principal')) {
      score += 3;
    }

    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Predict next role based on current level
   */
  private predictNextRole(currentLevel: ExperienceLevel, jobTitle: string): string {
    const levelPaths: Record<ExperienceLevel, string[]> = {
      [ExperienceLevel.JUNIOR]: ['Mid-level Developer', 'Software Engineer II', 'Associate Engineer'],
      [ExperienceLevel.MID]: ['Senior Developer', 'Staff Engineer', 'Tech Lead'],
      [ExperienceLevel.SENIOR]: ['Lead Engineer', 'Principal Engineer', 'Engineering Manager'],
      [ExperienceLevel.LEAD]: ['Director of Engineering', 'VP of Engineering', 'CTO'],
    };

    // Check if job title suggests a promotion
    const levelKeywords: Record<string, ExperienceLevel> = {
      'junior': ExperienceLevel.JUNIOR,
      'senior': ExperienceLevel.SENIOR,
      'lead': ExperienceLevel.LEAD,
      'principal': ExperienceLevel.LEAD,
      'director': ExperienceLevel.LEAD,
      'vp': ExperienceLevel.LEAD,
      'manager': ExperienceLevel.LEAD,
    };

    for (const [keyword, level] of Object.entries(levelKeywords)) {
      if (jobTitle.includes(keyword) && level !== currentLevel) {
        return levelPaths[currentLevel]?.[0] || `${level} Role`;
      }
    }

    return levelPaths[currentLevel]?.[0] || 'Senior Role';
  }

  /**
   * Calculate salary projection
   */
  private calculateSalaryProjection(
    currentLevel: ExperienceLevel,
    jobPosting: JobPosting,
  ): { current: number; nextRole: number; growth: number } {
    const currentPath = this.EXPERIENCE_PATHS[currentLevel];
    const nextLevel = this.getNextLevel(currentLevel);
    const nextPath = nextLevel ? this.EXPERIENCE_PATHS[nextLevel] : currentPath;

    // Estimate current salary from job posting or use defaults
    const jobSalary = jobPosting.salaryRange as { min?: number; max?: number } | null;
    const current = jobSalary?.min || currentPath.salaryRange.min;
    const nextRoleSalary = nextPath.salaryRange.max;

    const growth = nextRoleSalary > 0 ? (nextRoleSalary - current) / current : 0;

    return {
      current,
      nextRole: nextRoleSalary,
      growth: Math.round(growth * 100) / 100,
    };
  }

  /**
   * Get next experience level
   */
  private getNextLevel(current: ExperienceLevel): ExperienceLevel | null {
    const levels = Object.values(ExperienceLevel);
    const currentIndex = levels.indexOf(current);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }

  /**
   * Analyze skill gaps
   */
  private analyzeSkillGap(
    currentSkills: string[],
    jobSkills: string[],
    currentLevel: ExperienceLevel,
  ): SkillGapAnalysis {
    const currentSkillSet = new Set(currentSkills.map(s => s.toLowerCase()));
    const jobSkillSet = new Set(jobSkills.map(s => s.toLowerCase()));

    // Find missing skills
    const missingSkills = jobSkills.filter(
      skill => !currentSkillSet.has(skill.toLowerCase()),
    );

    // Find transferable skills
    const transferableSkills = currentSkills.filter(
      skill => this.isTransferable(skill, jobSkills),
    );

    // Recommend skills for career progression
    const recommendedSkills = this.recommendSkillsForLevel(currentSkills, currentLevel);

    // Prioritize skills
    const skillPriority = this.prioritizeSkills(missingSkills, jobSkills);

    return {
      missingSkills: missingSkills.slice(0, 5),
      recommendedSkills,
      transferableSkills: transferableSkills.slice(0, 5),
      skillPriority,
    };
  }

  /**
   * Extract skills from persona/job skills array
   */
  private extractSkills(skills: any): string[] {
    if (!skills) return [];
    if (Array.isArray(skills)) {
      return skills.map(skill => typeof skill === 'string' ? skill : (skill.name || '')).filter(Boolean);
    }
    return [];
  }

  /**
   * Check if a skill is transferable to other domains
   */
  private isTransferable(skill: string, targetSkills: string[]): boolean {
    const transferableKeywords = [
      'communication', 'leadership', 'problem solving', 'agile', 'project management',
      'teamwork', 'analytical', 'critical thinking', 'time management',
    ];

    const skillLower = skill.toLowerCase();
    return transferableKeywords.some(keyword => skillLower.includes(keyword));
  }

  /**
   * Recommend skills based on current skills and level
   */
  private recommendSkillsForLevel(currentSkills: string[], level: ExperienceLevel): string[] {
    const recommendations: string[] = [];

    for (const skill of currentSkills) {
      const progression = this.SKILL_PROGRESSION[skill];
      if (progression) {
        recommendations.push(...progression);
      }
    }

    // Add level-appropriate skills
    const levelSkills: Record<ExperienceLevel, string[]> = {
      [ExperienceLevel.JUNIOR]: ['Communication', 'Teamwork', 'Git', 'Testing'],
      [ExperienceLevel.MID]: ['System Design', 'Code Review', 'Mentoring', 'CI/CD'],
      [ExperienceLevel.SENIOR]: ['Architecture', 'Leadership', 'Strategy', 'Technical Writing'],
      [ExperienceLevel.LEAD]: ['People Management', 'Budgeting', 'Strategic Planning', 'Executive Communication'],
    };

    recommendations.push(...levelSkills[level]);

    return [...new Set(recommendations)].slice(0, 10);
  }

  /**
   * Prioritize skills by importance
   */
  private prioritizeSkills(
    missingSkills: string[],
    requiredSkills: string[],
  ): { skill: string; priority: 'high' | 'medium' | 'low' }[] {
    const priorityMap = new Map<string, 'high' | 'medium' | 'low'>();
    const requiredSet = new Set(requiredSkills.map(s => s.toLowerCase()));

    for (const skill of missingSkills) {
      if (requiredSet.has(skill.toLowerCase())) {
        priorityMap.set(skill, 'high');
      } else {
        priorityMap.set(skill, 'medium');
      }
    }

    return Array.from(priorityMap.entries()).map(([skill, priority]) => ({
      skill,
      priority,
    }));
  }

  /**
   * Generate career recommendations
   */
  private generateRecommendations(
    persona: Partial<Persona>,
    jobPosting: JobPosting,
    skillGap: SkillGapAnalysis,
  ): string[] {
    const recommendations: string[] = [];

    // Skill recommendations
    if (skillGap.missingSkills.length > 0) {
      recommendations.push(`Focus on learning: ${skillGap.missingSkills.slice(0, 3).join(', ')}`);
    }

    // Growth recommendations
    recommendations.push('Seek mentorship opportunities within the organization');

    if (persona.experienceLevel === ExperienceLevel.MID) {
      recommendations.push('Consider taking ownership of small projects to demonstrate leadership potential');
    }

    // Networking recommendations
    recommendations.push('Engage with the engineering community within the company');

    // Skill development
    if (skillGap.recommendedSkills.length > 0) {
      recommendations.push(`Consider certification in: ${skillGap.recommendedSkills[0]}`);
    }

    return recommendations;
  }

  /**
   * Estimate timeline for next role
   */
  private estimateTimeline(currentLevel: ExperienceLevel, nextRole: string): string {
    const timelines: Record<ExperienceLevel, string> = {
      [ExperienceLevel.JUNIOR]: '12-24 months',
      [ExperienceLevel.MID]: '18-36 months',
      [ExperienceLevel.SENIOR]: '24-48 months',
      [ExperienceLevel.LEAD]: '36-60 months',
    };

    return timelines[currentLevel] || '24 months';
  }

  /**
   * Calculate overall trajectory score
   */
  private calculateTrajectoryScore(
    growthPotential: 'high' | 'medium' | 'low',
    skillGap: SkillGapAnalysis,
    salaryGrowth: number,
  ): number {
    let score = 0.5;

    // Adjust for growth potential
    if (growthPotential === 'high') score += 0.2;
    else if (growthPotential === 'low') score -= 0.2;

    // Adjust for skill gap (fewer gaps = higher score)
    const gapPenalty = Math.min(0.15, skillGap.missingSkills.length * 0.03);
    score -= gapPenalty;

    // Adjust for salary growth
    if (salaryGrowth > 0.3) score += 0.1;
    else if (salaryGrowth > 0.15) score += 0.05;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get career path for a role
   */
  getCareerPath(jobTitle: string): ExperiencePath[] {
    const title = jobTitle.toLowerCase();
    
    if (title.includes('junior') || title.includes('entry')) {
      return [
        this.EXPERIENCE_PATHS[ExperienceLevel.JUNIOR],
        this.EXPERIENCE_PATHS[ExperienceLevel.MID],
      ];
    } else if (title.includes('senior') || title.includes('staff')) {
      return [
        this.EXPERIENCE_PATHS[ExperienceLevel.MID],
        this.EXPERIENCE_PATHS[ExperienceLevel.SENIOR],
        this.EXPERIENCE_PATHS[ExperienceLevel.LEAD],
      ];
    } else if (title.includes('lead') || title.includes('principal') || title.includes('director')) {
      return [
        this.EXPERIENCE_PATHS[ExperienceLevel.SENIOR],
        this.EXPERIENCE_PATHS[ExperienceLevel.LEAD],
      ];
    }

    return Object.values(this.EXPERIENCE_PATHS);
  }

  /**
   * Assess if a job is a good career move
   */
  async assessCareerMove(
    currentPersona: Partial<Persona>,
    targetJob: JobPosting,
  ): Promise<{
    recommendation: 'strong_yes' | 'yes' | 'neutral' | 'no';
    reasons: string[];
    risks: string[];
  }> {
    const trajectory = await this.predictTrajectory(currentPersona, targetJob);
    const reasons: string[] = [];
    const risks: string[] = [];

    // Evaluate reasons
    if (trajectory.growthPotential === 'high') {
      reasons.push('High growth potential company/role');
    }
    if (trajectory.salaryProjection.growth > 0.15) {
      reasons.push(`Strong salary growth potential (+${Math.round(trajectory.salaryProjection.growth * 100)}%)`);
    }
    if (trajectory.trajectoryScore > 0.7) {
      reasons.push('Good alignment with career goals');
    }

    // Evaluate risks
    if (trajectory.skillGap.missingSkills.length > 3) {
      risks.push(`Requires learning ${trajectory.skillGap.missingSkills.length} new skills`);
    }
    if (trajectory.growthPotential === 'low') {
      risks.push('Limited growth opportunities in this role');
    }

    // Calculate recommendation
    const score = trajectory.trajectoryScore + (reasons.length * 0.05) - (risks.length * 0.1);

    let recommendation: 'strong_yes' | 'yes' | 'neutral' | 'no';
    if (score >= 0.8) recommendation = 'strong_yes';
    else if (score >= 0.6) recommendation = 'yes';
    else if (score >= 0.4) recommendation = 'neutral';
    else recommendation = 'no';

    return {
      recommendation,
      reasons,
      risks,
    };
  }
}
