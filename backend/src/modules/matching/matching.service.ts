import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface MatchScoreBreakdown {
  skills: number;
  experience: number;
  salary: number;
  location: number;
}

interface MatchResult {
  jobPostingId: string;
  personaId: string;
  overallScore: number;
  breakdown: MatchScoreBreakdown;
  thresholdMet: boolean;
  reasons: string[];
}

const WEIGHTS = { skills: 0.55, experience: 0.2, salary: 0.15, location: 0.1 };
const MIN_SCORE = 0.6;

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private prisma: PrismaService) {}

  async getMatchesForUser(userId: string, query: { limit?: number }) {
    const limit = query.limit || 10;

    const personas = await this.prisma.persona.findMany({
      where: { userId },
      include: { profile: { include: { user: { include: { preferences: true } } } } },
    });

    if (personas.length === 0) {
      return { matches: [], message: 'Create a persona to see job matches' };
    }

    const persona = personas.find((p) => p.isDefault) || personas[0];
    const jobs = await this.prisma.jobPosting.findMany({
      where: { isExpired: false },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const matches = jobs
      .map((job) => this.calculateMatch(persona, job))
      .filter((m) => m.overallScore > 0.3)
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit);

    return { matches, personaId: persona.id };
  }

  async getMatchScore(personaId: string, jobPostingId: string): Promise<MatchResult> {
    const persona = await this.prisma.persona.findUnique({
      where: { id: personaId },
      include: { profile: { include: { user: { include: { preferences: true } } } } },
    });
    if (!persona) throw new NotFoundException('Persona not found');

    const job = await this.prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
    if (!job) throw new NotFoundException('Job posting not found');

    return this.calculateMatch(persona, job);
  }

  private calculateMatch(persona: any, job: any): MatchResult {
    const skillsScore = this.calculateSkillsMatch(persona.skills, job.skills);
    const experienceScore = this.calculateExperienceMatch(persona.experienceLevel, job);
    const salaryScore = this.calculateSalaryMatch(persona.profile?.user?.preferences, job.salaryRange);
    const locationScore = this.calculateLocationMatch(persona.profile?.user?.preferences, job.location, job.remotePreference);

    const breakdown: MatchScoreBreakdown = {
      skills: skillsScore * WEIGHTS.skills,
      experience: experienceScore * WEIGHTS.experience,
      salary: salaryScore * WEIGHTS.salary,
      location: locationScore * WEIGHTS.location,
    };

    const overallScore = Object.values(breakdown).reduce((sum, v) => sum + Math.max(0, Math.min(1, v)), 0);
    const reasons = this.generateReasons(skillsScore, experienceScore, salaryScore, locationScore, persona, job);

    return {
      jobPostingId: job.id,
      personaId: persona.id,
      overallScore,
      breakdown,
      thresholdMet: overallScore >= MIN_SCORE,
      reasons,
    };
  }

  private calculateSkillsMatch(personaSkills: any, jobSkills: any): number {
    const pSkills = Array.isArray(personaSkills) ? personaSkills.map((s: any) => (typeof s === 'string' ? s : s?.name || '').toLowerCase().trim()).filter(Boolean) : [];
    const jSkills = Array.isArray(jobSkills) ? jobSkills.map((s: any) => (typeof s === 'string' ? s : s?.name || '').toLowerCase().trim()).filter(Boolean) : [];

    if (jSkills.length === 0) return 1;
    const pSet = new Set(pSkills);
    let matched = 0;
    for (const skill of jSkills) {
      if (pSet.has(skill)) matched++;
    }
    return matched / jSkills.length;
  }

  private calculateExperienceMatch(personaLevel: string | null, job: any): number {
    const levelMap: Record<string, number> = { JUNIOR: 1, MID: 2, SENIOR: 3, LEAD: 4 };
    const personaValue = levelMap[personaLevel?.toUpperCase() || ''] || 2;

    const jobStr = JSON.stringify(job.experiences || job.requirements || job.description || '').toLowerCase();
    let jobLevel = 2;
    if (jobStr.includes('lead') || jobStr.includes('principal')) jobLevel = 4;
    else if (jobStr.includes('senior')) jobLevel = 3;
    else if (jobStr.includes('mid') || jobStr.includes('intermediate')) jobLevel = 2;
    else if (jobStr.includes('junior') || jobStr.includes('entry')) jobLevel = 1;

    const diff = Math.abs(personaValue - jobLevel);
    return Math.max(0, 1 - diff * 0.3);
  }

  private calculateSalaryMatch(preferences: any, salaryRange: any): number {
    if (!preferences || !salaryRange) return 0.5;
    const prefMin = preferences.salaryMin || 0;
    const prefMax = preferences.salaryMax || Infinity;
    const jobMin = (salaryRange as any)?.min || 0;
    const jobMax = (salaryRange as any)?.max || Infinity;

    if (jobMax < prefMin) return Math.max(0, 1 - (prefMin - jobMax) / prefMin);
    if (jobMin > prefMax) return Math.max(0, 1 - (jobMin - prefMax) / jobMin);
    return 1;
  }

  private calculateLocationMatch(preferences: any, jobLocation: string, remotePreference: string): number {
    if (remotePreference === 'REMOTE') return 1;
    if (!preferences?.desiredLocations) return 0.5;

    const desired = Array.isArray(preferences.desiredLocations) ? preferences.desiredLocations : [];
    if (desired.length === 0) return 0.5;

    const jobLoc = jobLocation.toLowerCase();
    for (const loc of desired) {
      if (jobLoc.includes(String(loc).toLowerCase())) return 1;
    }
    return remotePreference === 'HYBRID' ? 0.5 : 0.2;
  }

  private generateReasons(skills: number, experience: number, salary: number, location: number, persona: any, job: any): string[] {
    const reasons: string[] = [];
    if (skills >= 0.7) reasons.push('Strong skills match');
    if (experience >= 0.8) reasons.push('Experience level aligned');
    if (salary >= 0.8) reasons.push('Salary expectations met');
    if (location >= 0.8) reasons.push('Location compatible');
    if (job.remotePreference === 'REMOTE') reasons.push('Remote position');
    if (reasons.length === 0) reasons.push('Partial match');
    return reasons;
  }
}
