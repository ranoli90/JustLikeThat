import { Injectable, Logger } from '@nestjs/common';
import { JobPosting, RemotePreference, JobType } from '../../entities/job-posting.entity';
import { RawJobData } from './integrations/base-job-source.interface';

export interface NormalizedJob {
  title: string;
  company: string;
  location: string;
  remotePreference: RemotePreference;
  jobType: JobType;
  salaryRange: { min: number; max: number; currency: string } | null;
  description: string;
  requirements: string[];
  skills: string[];
  experiences: { minYears: number; maxYears: number }[];
  applyUrl: string;
  source: string;
  sourceUrl: string;
  logoUrl?: string;
  externalId?: string;
  normalizedAt: Date;
}

export interface NormalizationStats {
  total: number;
  successful: number;
  failed: number;
  withSalary: number;
  withRemote: number;
  withSkills: number;
}

@Injectable()
export class JobNormalizationService {
  private readonly logger = new Logger(JobNormalizationService.name);

  // Common job title variations and their normalized forms
  private readonly titleMappings: Record<string, string> = {
    'sr.': 'Senior',
    'sr ': 'Senior ',
    'sr-': 'Senior-',
    'jun.': 'Junior',
    'jr.': 'Junior',
    'jr ': 'Junior ',
    'jr-': 'Junior-',
    'lead ': 'Lead ',
    'principal': 'Principal',
    'staff': 'Staff',
    'director': 'Director',
    'manager': 'Manager',
    'engineer': 'Engineer',
    'developer': 'Developer',
    'designer': 'Designer',
    'analyst': 'Analyst',
    'consultant': 'Consultant',
    'architect': 'Architect',
  };

  // Remote-related keywords
  private readonly remoteKeywords = [
    'remote', 'work from home', 'wfh', 'telecommute', 'telecommuting',
    'anywhere', 'worldwide', 'from anywhere', 'distributed team',
    'home-based', 'location independent', 'digital nomad'
  ];

  // Hybrid-related keywords
  private readonly hybridKeywords = [
    'hybrid', 'partially remote', 'flexible', '2-3 days', 
    '3 days', 'partial remote', 'hybrid remote', 'mixed'
  ];

  // Common skills to extract
  private readonly commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust',
    'react', 'angular', 'vue', 'svelte', 'node.js', 'nodejs', 'node',
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'graphql', 'rest', 'api', 'microservices',
    'git', 'github', 'gitlab', 'ci/cd', 'devops', 'ml', 'ai', 'machine learning',
    'data science', 'tensorflow', 'pytorch', 'excel', 'tableau', 'power bi',
    'agile', 'scrum', 'jira', 'confluence', 'figma', 'sketch', 'adobe'
  ];

  normalize(job: RawJobData): NormalizedJob {
    return {
      title: this.normalizeTitle(job.title),
      company: this.normalizeCompany(job),
      location: this.normalizeLocation(job),
      remotePreference: this.normalizeRemotePreference(job),
      jobType: this.normalizeJobType(job),
      salaryRange: this.normalizeSalary(job),
      description: this.normalizeDescription(job.description),
      requirements: this.normalizeRequirements(job),
      skills: this.normalizeSkills(job),
      experiences: this.normalizeExperience(job),
      applyUrl: this.normalizeApplyUrl(job),
      source: this.normalizeSource(job.source),
      sourceUrl: job.sourceUrl || job.applyUrl || '',
      logoUrl: job.companyLogo || job.logoUrl,
      externalId: job.externalId,
      normalizedAt: new Date(),
    };
  }

  normalizeBatch(jobs: RawJobData[]): { normalized: NormalizedJob[]; stats: NormalizationStats } {
    const normalized: NormalizedJob[] = [];
    const stats: NormalizationStats = {
      total: jobs.length,
      successful: 0,
      failed: 0,
      withSalary: 0,
      withRemote: 0,
      withSkills: 0,
    };

    for (const job of jobs) {
      try {
        const result = this.normalize(job);
        normalized.push(result);
        stats.successful++;
        
        if (result.salaryRange) stats.withSalary++;
        if (result.remotePreference !== RemotePreference.ONSITE) stats.withRemote++;
        if (result.skills.length > 0) stats.withSkills++;
      } catch (error) {
        this.logger.error(`Failed to normalize job: ${job.title}`, error);
        stats.failed++;
      }
    }

    return { normalized, stats };
  }

  private normalizeTitle(title: string | undefined): string {
    if (!title) return 'Unknown Position';
    
    let normalized = title.trim();
    
    // Fix common title variations
    for (const [abbrev, full] of Object.entries(this.titleMappings)) {
      normalized = normalized.replace(new RegExp(abbrev, 'gi'), full);
    }
    
    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    // Capitalize first letter of each word
    normalized = normalized.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    return normalized;
  }

  private normalizeCompany(job: RawJobData): string {
    const company = job.company || job.companyName;
    if (!company) return 'Unknown Company';
    
    // Clean up company name
    return company
      .replace(/\s+(inc|llc|ltd|corp|corporation|company|co\.?)$/i, '')
      .replace(/["']/g, '')
      .trim();
  }

  private normalizeLocation(job: RawJobData): string {
    if (job.location) return job.location;
    
    const parts: string[] = [];
    if (job.city) parts.push(job.city);
    if (job.state) parts.push(job.state);
    if (job.country) parts.push(job.country);
    
    if (parts.length > 0) return parts.join(', ');
    
    return 'Remote';
  }

  private normalizeRemotePreference(job: RawJobData): RemotePreference {
    // Check explicit remote flag
    if (job.remote === true || job.remote === 'true') {
      return RemotePreference.REMOTE;
    }
    
    // Check remote policy string
    if (job.remotePolicy) {
      const policy = job.remotePolicy.toLowerCase();
      
      if (policy.includes('remote')) {
        return RemotePreference.REMOTE;
      }
      if (policy.includes('hybrid')) {
        return RemotePreference.HYBRID;
      }
      if (policy.includes('onsite') || policy.includes('in-office') || policy.includes('in office')) {
        return RemotePreference.ONSITE;
      }
    }
    
    // Check job description for remote keywords
    const description = (job.description || '').toLowerCase();
    const title = (job.title || '').toLowerCase();
    const combined = `${description} ${title}`;
    
    for (const keyword of this.hybridKeywords) {
      if (combined.includes(keyword)) {
        return RemotePreference.HYBRID;
      }
    }
    
    for (const keyword of this.remoteKeywords) {
      if (combined.includes(keyword)) {
        return RemotePreference.REMOTE;
      }
    }
    
    return RemotePreference.ONSITE;
  }

  private normalizeJobType(job: RawJobData): JobType {
    const type = (job.jobType || job.employmentType || '').toLowerCase();
    
    if (type.includes('full') || type.includes('permanent') || type.includes('fte')) {
      return JobType.FULL_TIME;
    }
    if (type.includes('part') || type.includes('partial')) {
      return JobType.PART_TIME;
    }
    if (type.includes('contract') || type.includes('temp') || type.includes('freelance')) {
      return JobType.CONTRACT;
    }
    if (type.includes('intern')) {
      return JobType.INTERNSHIP;
    }
    
    return JobType.FULL_TIME;
  }

  private normalizeSalary(job: RawJobData): { min: number; max: number; currency: string } | null {
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

  private normalizeDescription(description: string | undefined): string {
    if (!description) return 'No description provided';
    
    // Remove HTML tags
    let cleaned = description.replace(/<[^>]*>/g, '');
    
    // Decode common HTML entities
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/&#\d+;/g, '');
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Limit length
    if (cleaned.length > 10000) {
      cleaned = cleaned.substring(0, 10000) + '...';
    }
    
    return cleaned;
  }

  private normalizeRequirements(job: RawJobData): string[] {
    const requirements: string[] = [];
    
    // Use explicit requirements if available
    if (job.requirements && Array.isArray(job.requirements)) {
      requirements.push(...job.requirements);
    }
    
    if (job.qualifications && Array.isArray(job.qualifications)) {
      requirements.push(...job.qualifications);
    }
    
    return [...new Set(requirements.filter(Boolean))];
  }

  private normalizeSkills(job: RawJobData): string[] {
    const skills: string[] = [];
    
    // Use explicit skills if available
    if (job.skills && Array.isArray(job.skills)) {
      skills.push(...job.skills);
    }
    
    if (job.tags && Array.isArray(job.tags)) {
      skills.push(...job.tags);
    }
    
    // Extract skills from description if none provided
    if (skills.length === 0 && job.description) {
      const extracted = this.extractSkillsFromDescription(job.description);
      skills.push(...extracted);
    }
    
    return [...new Set(skills.filter(Boolean))];
  }

  private extractSkillsFromDescription(description: string): string[] {
    const foundSkills: string[] = [];
    const lowerDesc = description.toLowerCase();
    
    for (const skill of this.commonSkills) {
      if (lowerDesc.includes(skill)) {
        foundSkills.push(skill);
      }
    }
    
    return foundSkills;
  }

  private normalizeExperience(job: RawJobData): { minYears: number; maxYears: number }[] {
    if (job.experience?.minYears || job.experience?.maxYears) {
      return [{
        minYears: job.experience.minYears || 0,
        maxYears: job.experience.maxYears || 0,
      }];
    }
    
    return [];
  }

  private normalizeApplyUrl(job: RawJobData): string {
    return job.applyUrl || job.applicationUrl || job.sourceUrl || '';
  }

  private normalizeSource(source: string | undefined): string {
    if (!source) return 'unknown';
    return source.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
}
