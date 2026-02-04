import { Injectable, Logger } from '@nestjs/common';

export interface PreferenceProfile {
  userId: string;
  explicitPreferences: ExplicitPreferences;
  implicitPreferences: ImplicitPreferences;
  preferenceWeights: PreferenceWeights;
  confidence: ConfidenceScores;
  lastUpdated: Date;
}

export interface ExplicitPreferences {
  desiredRoles: string[];
  preferredLocations: string[];
  remotePreference: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  jobTypes: string[];
  salaryRange: { min: number; max: number };
  preferredIndustries: string[];
  companySizePreference: string;
  workStylePreference: string;
  culturalValues: string[];
  techStack: string[];
}

export interface ImplicitPreferences {
  viewedJobTitles: Record<string, number>;
  savedJobLocations: Record<string, number>;
  appliedJobTypes: Record<string, number>;
  salaryImplication: number;
  industryAffinities: Record<string, number>;
  companySizeAffinities: Record<string, number>;
  skillAffinities: Record<string, number>;
  remoteAffinities: Record<string, number>;
}

export interface PreferenceWeights {
  roleWeight: number;
  locationWeight: number;
  salaryWeight: number;
  cultureWeight: number;
  growthWeight: number;
  techStackWeight: number;
}

export interface ConfidenceScores {
  roleConfidence: number;
  locationConfidence: number;
  salaryConfidence: number;
  cultureConfidence: number;
  overallConfidence: number;
}

@Injectable()
export class PreferenceModelingService {
  private readonly logger = new Logger(PreferenceModelingService.name);

  async buildPreferenceProfile(userId: string): Promise<PreferenceProfile> {
    const explicitPrefs = this.getDefaultExplicitPreferences();
    const implicitPrefs = this.getDefaultImplicitPreferences();
    const weights = this.calculatePreferenceWeights(explicitPrefs, implicitPrefs);
    const confidence = this.calculateConfidence(explicitPrefs, implicitPrefs);

    return {
      userId,
      explicitPreferences: explicitPrefs,
      implicitPreferences: implicitPrefs,
      preferenceWeights: weights,
      confidence,
      lastUpdated: new Date(),
    };
  }

  private getDefaultExplicitPreferences(): ExplicitPreferences {
    return {
      desiredRoles: [],
      preferredLocations: [],
      remotePreference: 'flexible',
      jobTypes: ['FULL_TIME'],
      salaryRange: { min: 50000, max: 200000 },
      preferredIndustries: [],
      companySizePreference: 'any',
      workStylePreference: 'balanced',
      culturalValues: [],
      techStack: [],
    };
  }

  private getDefaultImplicitPreferences(): ImplicitPreferences {
    return {
      viewedJobTitles: {},
      savedJobLocations: {},
      appliedJobTypes: {},
      salaryImplication: 0.5,
      industryAffinities: {},
      companySizeAffinities: {},
      skillAffinities: {},
      remoteAffinities: { remote: 0.5, hybrid: 0.3, onsite: 0.2 },
    };
  }

  private calculatePreferenceWeights(explicit: ExplicitPreferences, implicit: ImplicitPreferences): PreferenceWeights {
    const weights: PreferenceWeights = {
      roleWeight: 0.25,
      locationWeight: 0.15,
      salaryWeight: 0.20,
      cultureWeight: 0.15,
      growthWeight: 0.15,
      techStackWeight: 0.10,
    };

    const roleActivity = Object.keys(implicit.viewedJobTitles).length;
    if (roleActivity > 5) weights.roleWeight += 0.1;

    const locationActivity = Object.keys(implicit.savedJobLocations).length;
    if (locationActivity > 3) weights.locationWeight += 0.05;

    if (explicit.culturalValues.length > 0) weights.cultureWeight += 0.1;
    if (explicit.techStack.length > 3) weights.techStackWeight += 0.05;

    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    for (const key of Object.keys(weights) as (keyof PreferenceWeights)[]) {
      weights[key] = weights[key] / total;
    }

    return weights;
  }

  private calculateConfidence(explicit: ExplicitPreferences, implicit: ImplicitPreferences): ConfidenceScores {
    const roleConfidence = explicit.desiredRoles.length > 0 ? Math.min(1, explicit.desiredRoles.length * 0.2 + 0.5) : 0.3;
    const locationConfidence = explicit.preferredLocations.length > 0 ? Math.min(1, explicit.preferredLocations.length * 0.2 + 0.5) : 0.3;
    const salaryConfidence = explicit.salaryRange.min > 0 && explicit.salaryRange.max > explicit.salaryRange.min ? 0.8 : 0.4;
    const cultureConfidence = explicit.culturalValues.length > 0 ? Math.min(1, explicit.culturalValues.length * 0.25) : 0.2;
    const overallConfidence = roleConfidence * 0.3 + locationConfidence * 0.2 + salaryConfidence * 0.2 + cultureConfidence * 0.3;

    return { roleConfidence, locationConfidence, salaryConfidence, cultureConfidence, overallConfidence };
  }

  async predictJobMatch(userId: string, jobData: { title: string; location: string; remotePreference: string; salaryRange?: { min: number; max: number }; skills: string[] }): Promise<{ overallScore: number; breakdown: Record<string, number>; factors: string[] }> {
    const profile = await this.buildPreferenceProfile(userId);
    const weights = profile.preferenceWeights;
    const breakdown: Record<string, number> = {};

    const roleMatch = profile.explicitPreferences.desiredRoles.some(role => jobData.title.toLowerCase().includes(role.toLowerCase())) ? 0.9 : 0.5;
    breakdown.role = roleMatch;

    const locationMatch = profile.explicitPreferences.preferredLocations.some(loc => jobData.location.toLowerCase().includes(loc.toLowerCase())) ? 0.9 : 0.6;
    breakdown.location = locationMatch;

    let salaryMatch = 0.5;
    if (jobData.salaryRange) {
      const userMin = profile.explicitPreferences.salaryRange.min;
      const userMax = profile.explicitPreferences.salaryRange.max;
      const jobMin = jobData.salaryRange.min;
      const overlap = Math.min(userMax, jobData.salaryRange.max) - Math.max(userMin, jobMin);
      const range = userMax - userMin;
      salaryMatch = range > 0 ? Math.max(0, Math.min(1, overlap / range)) : 0.5;
    }
    breakdown.salary = salaryMatch;

    const techStackMatch = profile.explicitPreferences.techStack.filter(skill => jobData.skills.some(jobSkill => jobSkill.toLowerCase().includes(skill.toLowerCase()))).length / Math.max(profile.explicitPreferences.techStack.length, 1);
    breakdown.techStack = techStackMatch;

    const remoteScores: Record<string, Record<string, number>> = {
      'remote': { 'remote': 1, 'hybrid': 0.7, 'onsite': 0.3 },
      'hybrid': { 'remote': 0.7, 'hybrid': 1, 'onsite': 0.5 },
      'onsite': { 'remote': 0.3, 'hybrid': 0.5, 'onsite': 1 },
      'flexible': { 'remote': 0.9, 'hybrid': 0.9, 'onsite': 0.9 },
    };

    const remoteEntry = remoteScores[profile.explicitPreferences.remotePreference] || remoteScores['flexible'];
    const remoteScore = remoteEntry[jobData.remotePreference] || 0.5;
    breakdown.remote = remoteScore;

    const overallScore = weights.roleWeight * breakdown.role + weights.locationWeight * breakdown.location + weights.salaryWeight * breakdown.salary + weights.techStackWeight * breakdown.techStack + weights.cultureWeight * 0.5 + weights.growthWeight * 0.5;

    const factors: string[] = [];
    if (breakdown.role > 0.7) factors.push('Role matches your preferences');
    if (breakdown.location > 0.7) factors.push('Location aligns with preferences');
    if (breakdown.salary > 0.7) factors.push('Salary meets expectations');
    if (breakdown.techStack > 0.7) factors.push('Tech stack is a good fit');
    if (breakdown.remote > 0.7) factors.push('Work arrangement matches preference');

    return { overallScore, breakdown, factors };
  }

  async getRecommendedPreferences(userId: string): Promise<{ recommendations: string[]; suggestedRoles: string[]; suggestedLocations: string[]; suggestedTechStack: string[]; confidence: number }> {
    const profile = await this.buildPreferenceProfile(userId);
    const recommendations: string[] = [];

    const suggestedRoles = Object.entries(profile.implicitPreferences.viewedJobTitles || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([role]) => role);
    if (suggestedRoles.length === 0 && profile.explicitPreferences.desiredRoles.length === 0) {
      recommendations.push('Add your desired job roles to get better recommendations');
    }

    const suggestedLocations = Object.entries(profile.implicitPreferences.savedJobLocations || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([loc]) => loc);
    if (suggestedLocations.length === 0 && profile.explicitPreferences.preferredLocations.length === 0) {
      recommendations.push('Specify your preferred locations for more relevant job matches');
    }

    const suggestedTechStack = Object.entries(profile.implicitPreferences.skillAffinities || {}).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([skill]) => skill);
    if (suggestedTechStack.length === 0 && profile.explicitPreferences.techStack.length === 0) {
      recommendations.push('Add your tech skills to improve job matching');
    }

    if (profile.explicitPreferences.culturalValues.length === 0) {
      recommendations.push('Set your cultural preferences to find better-fitting companies');
    }

    return {
      recommendations,
      suggestedRoles,
      suggestedLocations,
      suggestedTechStack,
      confidence: profile.confidence.overallConfidence,
    };
  }
}
