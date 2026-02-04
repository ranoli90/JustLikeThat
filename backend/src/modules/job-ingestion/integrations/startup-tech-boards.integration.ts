import { Injectable, Logger } from '@nestjs/common';
import { BaseJobSource, JobSourceConfig, SearchParams, SearchResult, RawJobData } from './base-job-source.interface';
import { JobSourceCategory, ComplianceLevel, SourceReliability, CostEffectiveness } from '../../../entities/job-source.entity';
import { JobPosting } from '../../../entities/job-posting.entity';

@Injectable()
export class AngelListIntegration extends BaseJobSource {
  readonly sourceName = 'AngelList (Wellfound)';
  readonly sourceId = 'angellist';
  readonly category = JobSourceCategory.API_INTEGRATION;
  readonly complianceLevel = ComplianceLevel.MEDIUM;
  readonly reliability = SourceReliability.HIGH;
  readonly costEffectiveness = CostEffectiveness.HIGH;
  readonly requiresAuth = false;
  readonly isFree = true;

  private readonly logger = new Logger(AngelListIntegration.name);
  private readonly baseUrl = 'https://api.angel.co/v1';

  async authenticate(): Promise<boolean> {
    this.isAuthenticated = true;
    return true;
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const { keywords, location, page = 1, limit = 25 } = params;

    try {
      const queryParams = new URLSearchParams({
        search: keywords || '',
        location: location || '',
        page: page.toString(),
        per_page: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/jobs?${queryParams}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`AngelList API error: ${response.status}`);
      }

      const data = await response.json();
      const jobs = this.transformAngelListJobs(data.jobs || []);

      return {
        jobs,
        total: data.total || jobs.length,
        page,
        limit,
        hasMore: page * limit < (data.total || jobs.length),
        rateLimitRemaining: this.rateLimitRemaining,
      };
    } catch (error) {
      this.logger.error('AngelList search error', error);
      return { jobs: [], total: 0, page: 1, limit, hasMore: false };
    }
  }

  async fetchJobById(id: string): Promise<RawJobData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.transformAngelListJob(data);
    } catch (error) {
      this.logger.error(`Error fetching AngelList job ${id}`, error);
      return null;
    }
  }

  private transformAngelListJobs(jobs: any[]): RawJobData[] {
    return jobs.map((job: any) => this.transformAngelListJob(job));
  }

  private transformAngelListJob(job: any): RawJobData {
    return {
      externalId: job.id?.toString(),
      title: job.title,
      description: job.description,
      company: job.startup?.name,
      companyName: job.startup?.name,
      companyId: job.startup?.id?.toString(),
      location: job.location,
      city: job.city,
      remote: job.remote?.toLowerCase() === 'true',
      remotePolicy: job.remote ? 'remote' : 'onsite',
      jobType: job.job_type || 'Full-time',
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      postedDate: job.created_at,
      applyUrl: job.url,
      applicationDeadline: job.deadline,
      skills: job.tags?.map((tag: any) => tag.name) || [],
      tags: job.categories || [],
      logoUrl: job.startup?.logo_url,
      companyLogo: job.startup?.logo_url,
      source: 'angellist',
      sourceUrl: job.url,
    };
  }

  normalizeJob(job: RawJobData): JobPosting {
    const normalized = super.normalizeJob(job);
    (normalized as any).source = 'angellist';
    (normalized as any).sourceUrl = job.sourceUrl;
    return normalized;
  }
}

@Injectable()
export class DiceIntegration extends BaseJobSource {
  readonly sourceName = 'Dice';
  readonly sourceId = 'dice';
  readonly category = JobSourceCategory.API_INTEGRATION;
  readonly complianceLevel = ComplianceLevel.MEDIUM;
  readonly reliability = SourceReliability.HIGH;
  readonly costEffectiveness = CostEffectiveness.MEDIUM;
  readonly requiresAuth = true;
  readonly isFree = false;

  private readonly logger = new Logger(DiceIntegration.name);
  private readonly baseUrl = 'https://api.dice.com/diceopen';
  private apiKey: string = '';

  configure(config: JobSourceConfig): void {
    super.configure(config);
    this.apiKey = config.apiKey || config.accessToken || '';
  }

  async authenticate(): Promise<boolean> {
    if (this.apiKey && this.apiKey.length > 5) {
      this.isAuthenticated = true;
      this.logger.log('Dice authentication successful');
      return true;
    }
    this.logger.warn('Dice authentication failed - no API key');
    return false;
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const { keywords, location, page = 1, limit = 25 } = params;

    try {
      const queryParams = new URLSearchParams({
        q: keywords || '',
        location: location || '',
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/jobs?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Dice API error: ${response.status}`);
      }

      const data = await response.json();
      const jobs = this.transformDiceJobs(data.data || []);

      return {
        jobs,
        total: data.total || jobs.length,
        page,
        limit,
        hasMore: page * limit < (data.total || jobs.length),
        creditsUsed: jobs.length,
        rateLimitRemaining: this.rateLimitRemaining,
      };
    } catch (error) {
      this.logger.error('Dice search error', error);
      return { jobs: [], total: 0, page: 1, limit, hasMore: false };
    }
  }

  async fetchJobById(id: string): Promise<RawJobData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.transformDiceJob(data);
    } catch (error) {
      this.logger.error(`Error fetching Dice job ${id}`, error);
      return null;
    }
  }

  private transformDiceJobs(jobs: any[]): RawJobData[] {
    return jobs.map((job: any) => this.transformDiceJob(job));
  }

  private transformDiceJob(job: any): RawJobData {
    return {
      externalId: job.id?.toString(),
      title: job.title,
      description: job.description,
      company: job.company?.name,
      companyName: job.company?.name,
      location: job.location?.city || job.location,
      remote: job.remote?.toLowerCase() === 'true',
      remotePolicy: job.remote ? 'remote' : 'onsite',
      jobType: job.employmentType || 'Full-time',
      salaryMin: job.salary?.min || job.salaryMin,
      salaryMax: job.salary?.max || job.salaryMax,
      salaryCurrency: 'USD',
      postedDate: job.postedDate,
      applyUrl: job.applyUrl,
      requirements: job.requirements || [],
      skills: job.technologies || job.skills || [],
      tags: job.categories || [],
      logoUrl: job.company?.logo,
      companyLogo: job.company?.logo,
      source: 'dice',
      sourceUrl: job.applyUrl,
    };
  }

  normalizeJob(job: RawJobData): JobPosting {
    const normalized = super.normalizeJob(job);
    (normalized as any).source = 'dice';
    (normalized as any).sourceUrl = job.sourceUrl;
    return normalized;
  }
}

@Injectable()
export class TechCrunchIntegration extends BaseJobSource {
  readonly sourceName = 'TechCrunch';
  readonly sourceId = 'techcrunch';
  readonly category = JobSourceCategory.SCRAPER;
  readonly complianceLevel = ComplianceLevel.LOW;
  readonly reliability = SourceReliability.MEDIUM;
  readonly costEffectiveness = CostEffectiveness.HIGH;
  readonly requiresAuth = false;
  readonly isFree = true;

  private readonly logger = new Logger(TechCrunchIntegration.name);
  private readonly baseUrl = 'https://techcrunch.com';

  async authenticate(): Promise<boolean> {
    this.isAuthenticated = true;
    return true;
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const { keywords = '', page = 1, limit = 20 } = params;

    try {
      const queryParams = new URLSearchParams({
        s: keywords || 'hiring',
        paged: page.toString(),
      });

      const response = await fetch(`${this.baseUrl}?${queryParams}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`TechCrunch scraper error: ${response.status}`);
      }

      const html = await response.text();
      const jobs = this.parseTechCrunchJobs(html, keywords);

      return {
        jobs,
        total: jobs.length,
        page,
        limit,
        hasMore: jobs.length >= limit,
        rateLimitRemaining: this.rateLimitRemaining,
      };
    } catch (error) {
      this.logger.error('TechCrunch search error', error);
      return { jobs: [], total: 0, page: 1, limit, hasMore: false };
    }
  }

  async fetchJobById(id: string): Promise<RawJobData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        return null;
      }

      const html = await response.text();
      return this.parseTechCrunchJob(html, id);
    } catch (error) {
      this.logger.error(`Error fetching TechCrunch job ${id}`, error);
      return null;
    }
  }

  private parseTechCrunchJobs(html: string, keywords: string): RawJobData[] {
    const jobs: RawJobData[] = [];
    // Basic HTML parsing - in production, use a proper HTML parser like cheerio
    const jobPattern = /<article[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    
    let match;
    while ((match = jobPattern.exec(html)) !== null) {
      const jobHtml = match[1];
      const job = this.extractTechCrunchJob(jobHtml);
      if (job) {
        jobs.push(job);
      }
    }
    
    return jobs;
  }

  private extractTechCrunchJob(jobHtml: string): RawJobData | null {
    const titleMatch = jobHtml.match(/<h2[^>]*class="[^"]*entry-title[^"]*"[^>]*>(.*?)<\/h2>/i);
    const linkMatch = jobHtml.match(/href="([^"]*)"/i);
    const excerptMatch = jobHtml.match(/<div[^>]*class="[^"]*entry-excerpt[^"]*"[^>]*>(.*?)<\/div>/i);
    
    if (!titleMatch || !linkMatch) {
      return null;
    }

    return {
      title: this.stripHtml(titleMatch[1]),
      description: excerptMatch ? this.stripHtml(excerptMatch[1]) : '',
      applyUrl: linkMatch[1],
      source: 'techcrunch',
      sourceUrl: linkMatch[1],
      remote: true,
      remotePolicy: 'remote',
    };
  }

  private parseTechCrunchJob(html: string, id: string): RawJobData | null {
    return {
      externalId: id,
      description: html,
      source: 'techcrunch',
    };
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  normalizeJob(job: RawJobData): JobPosting {
    const normalized = super.normalizeJob(job);
    (normalized as any).source = 'techcrunch';
    (normalized as any).sourceUrl = job.sourceUrl;
    return normalized;
  }
}
