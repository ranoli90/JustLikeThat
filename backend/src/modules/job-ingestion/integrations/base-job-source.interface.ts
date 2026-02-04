import { JobPosting, RemotePreference, JobType } from '../../../entities/job-posting.entity';

export interface JobSourceConfig {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  baseUrl?: string;
  rateLimitPerMinute?: number;
  requestTimeout?: number;
}

export interface RawJobData {
  // Common fields from all sources
  id?: string;
  externalId?: string;
  title?: string;
  description?: string;
  company?: string;
  companyName?: string;
  companyId?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  remote?: boolean | string;
  remotePolicy?: string;
  jobType?: string;
  employmentType?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  };
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  postedDate?: string | Date;
  publishDate?: string | Date;
  applicationUrl?: string;
  applyUrl?: string;
  applicationDeadline?: string | Date;
  requirements?: string[];
  qualifications?: string[];
  skills?: string[];
  experience?: {
    minYears?: number;
    maxYears?: number;
  };
  education?: string;
  level?: string;
  category?: string;
  tags?: string[];
  benefits?: string[];
  logoUrl?: string;
  companyLogo?: string;
  source?: string;
  sourceUrl?: string;
}

export interface SearchParams {
  keywords?: string;
  location?: string;
  city?: string;
  country?: string;
  remote?: boolean;
  jobType?: JobType;
  salaryMin?: number;
  salaryMax?: number;
  experienceYears?: number;
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
}

export interface SearchResult {
  jobs: RawJobData[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  creditsUsed?: number;
  rateLimitRemaining?: number;
}

export interface AbstractJobSource {
  readonly sourceName: string;
  readonly sourceId: string;
  readonly category: string;
  readonly complianceLevel: string;
  readonly reliability: string;
  readonly costEffectiveness: string;
  readonly requiresAuth: boolean;
  readonly isFree: boolean;
  
  configure(config: JobSourceConfig): void;
  authenticate(): Promise<boolean>;
  search(params: SearchParams): Promise<SearchResult>;
  fetchJobById(id: string): Promise<RawJobData | null>;
  normalizeJob(job: RawJobData): JobPosting;
  getRateLimitInfo(): { limit: number; remaining: number; resetTime: number };
}

export abstract class BaseJobSource implements AbstractJobSource {
  abstract readonly sourceName: string;
  abstract readonly sourceId: string;
  abstract readonly category: string;
  abstract readonly complianceLevel: string;
  abstract readonly reliability: string;
  abstract readonly costEffectiveness: string;
  abstract readonly requiresAuth: boolean;
  abstract readonly isFree: boolean;
  
  protected config: JobSourceConfig = {};
  protected accessToken: string | null = null;
  protected isAuthenticated: boolean = false;
  protected rateLimitRemaining: number = 100;
  protected rateLimitReset: number = 0;
  
  configure(config: JobSourceConfig): void {
    this.config = { ...this.config, ...config };
  }
  
  async authenticate(): Promise<boolean> {
    this.isAuthenticated = false;
    return this.isAuthenticated;
  }
  
  abstract search(params: SearchParams): Promise<SearchResult>;
  abstract fetchJobById(id: string): Promise<RawJobData | null>;
  
  normalizeJob(job: RawJobData): JobPosting {
    return {
      title: this.normalizeTitle(job.title),
      company: this.normalizeCompany(job.company, job.companyName),
      location: this.normalizeLocation(job),
      remotePreference: this.normalizeRemotePreference(job),
      jobType: this.normalizeJobType(job),
      salaryRange: this.normalizeSalary(job),
      description: this.normalizeDescription(job.description),
      requirements: this.normalizeRequirements(job),
      skills: this.normalizeSkills(job),
      experiences: this.normalizeExperience(job),
      applyUrl: this.normalizeApplyUrl(job),
      isExpired: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as JobPosting;
  }
  
  protected normalizeTitle(title: string | undefined): string {
    return title?.trim() || 'Unknown Title';
  }
  
  protected normalizeCompany(company: string | undefined, companyName: string | undefined): string {
    return company?.trim() || companyName?.trim() || 'Unknown Company';
  }
  
  protected normalizeLocation(job: RawJobData): string {
    if (job.location) return job.location;
    if (job.city || job.state || job.country) {
      const parts = [job.city, job.state, job.country].filter(Boolean);
      return parts.join(', ');
    }
    return 'Remote';
  }
  
  protected normalizeRemotePreference(job: RawJobData): RemotePreference {
    if (job.remote === true || job.remotePolicy?.toLowerCase().includes('remote')) {
      return RemotePreference.REMOTE;
    }
    if (job.remotePolicy?.toLowerCase().includes('hybrid')) {
      return RemotePreference.HYBRID;
    }
    if (job.remotePolicy?.toLowerCase().includes('onsite') || job.remotePolicy?.toLowerCase().includes('in-office')) {
      return RemotePreference.ONSITE;
    }
    return RemotePreference.ONSITE;
  }
  
  protected normalizeJobType(job: RawJobData): JobType {
    const type = (job.jobType || job.employmentType || '').toLowerCase();
    if (type.includes('full') || type.includes('permanent')) {
      return JobType.FULL_TIME;
    }
    if (type.includes('part')) {
      return JobType.PART_TIME;
    }
    if (type.includes('contract') || type.includes('temporary')) {
      return JobType.CONTRACT;
    }
    if (type.includes('intern')) {
      return JobType.INTERNSHIP;
    }
    return JobType.FULL_TIME;
  }
  
  protected normalizeSalary(job: RawJobData): { min: number; max: number; currency: string } | null {
    if (job.salary) {
      return {
        min: job.salary.min || 0,
        max: job.salary.max || 0,
        currency: job.salary.currency || 'USD',
      };
    }
    if (job.salaryMin || job.salaryMax) {
      return {
        min: job.salaryMin || 0,
        max: job.salaryMax || 0,
        currency: job.salaryCurrency || 'USD',
      };
    }
    return null;
  }
  
  protected normalizeDescription(description: string | undefined): string {
    return description?.trim() || 'No description available';
  }
  
  protected normalizeRequirements(job: RawJobData): string[] {
    const requirements: string[] = [];
    if (job.requirements) {
      requirements.push(...job.requirements);
    }
    if (job.qualifications) {
      requirements.push(...job.qualifications);
    }
    return requirements.filter(Boolean);
  }
  
  protected normalizeSkills(job: RawJobData): string[] {
    const skills: string[] = [];
    if (job.skills) {
      skills.push(...job.skills);
    }
    if (job.tags) {
      skills.push(...job.tags);
    }
    return [...new Set(skills.filter(Boolean))];
  }
  
  protected normalizeExperience(job: RawJobData): { minYears: number; maxYears: number }[] {
    if (job.experience?.minYears || job.experience?.maxYears) {
      return [{
        minYears: job.experience.minYears || 0,
        maxYears: job.experience.maxYears || 0,
      }];
    }
    return [];
  }
  
  protected normalizeApplyUrl(job: RawJobData): string {
    return job.applyUrl || job.applicationUrl || job.sourceUrl || '';
  }
  
  getRateLimitInfo(): { limit: number; remaining: number; resetTime: number } {
    return {
      limit: this.config.rateLimitPerMinute || 60,
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitReset,
    };
  }
}
