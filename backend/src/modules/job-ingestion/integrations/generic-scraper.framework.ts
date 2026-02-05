import { Injectable, Logger } from '@nestjs/common';
import { BaseJobSource, JobSourceConfig, SearchParams, SearchResult, RawJobData } from './base-job-source.interface';
import { JobSourceCategory, ComplianceLevel, SourceReliability, CostEffectiveness } from '../../../entities/job-source.entity';
import { JobPosting } from '../../../entities/job-posting.entity';

// Pre-compiled safe regex patterns for common job scraping patterns
const SAFE_JOB_LIST_PATTERNS = [
  /<li[^>]*class="[^"]*job[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
  /<div[^>]*class="[^"]*job[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
  /<article[^>]*class="[^"]*job[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
];

// Validation function for regex patterns to prevent ReDoS
function isSafeRegexPattern(pattern: string): boolean {
  // Check for potentially malicious patterns
  const dangerPatterns = [
    /.{200,}/, // Too long
    /(\\S+){10,}/, // Excessive repetition
    /(\\([^)]*\\)){5,}/, // Nested groups
    /\[[^\]]*\]{5,}/, // Nested character classes
    /\{[^}]*\}{5,}/, // Nested quantifiers
  ];
  
  return !dangerPatterns.some(p => p.test(pattern));
}

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  searchUrl: string;
  jobUrlPattern: string;
  selectors: {
    jobList: string;
    jobTitle: string;
    jobCompany: string;
    jobLocation: string;
    jobDescription: string;
    jobUrl: string;
    jobSalary?: string;
    jobDate?: string;
    nextPage?: string;
  };
  paginationType?: 'offset' | 'page' | 'scroll';
  itemsPerPage?: number;
  rateLimitMs?: number;
}

@Injectable()
export class GenericScraperIntegration extends BaseJobSource {
  readonly sourceName = 'Generic Scraper';
  readonly sourceId = 'generic_scraper';
  readonly category = JobSourceCategory.SCRAPER;
  readonly complianceLevel = ComplianceLevel.LOW;
  readonly reliability = SourceReliability.MEDIUM;
  readonly costEffectiveness = CostEffectiveness.HIGH;
  readonly requiresAuth = false;
  readonly isFree = true;

  private readonly logger = new Logger(GenericScraperIntegration.name);
  private scraperConfig: ScraperConfig | null = null;

  configure(config: JobSourceConfig & { scraperConfig: ScraperConfig }): void {
    super.configure(config);
    if ((config as any).scraperConfig) {
      this.scraperConfig = (config as any).scraperConfig;
    }
  }

  async authenticate(): Promise<boolean> {
    this.isAuthenticated = true;
    return true;
  }

  async search(params: SearchParams): Promise<SearchResult> {
    const scraperConfig = this.scraperConfig;
    if (!scraperConfig) {
      throw new Error('Scraper configuration not set');
    }

    const { keywords = '', page = 1, limit = 25 } = params;
    const delayMs = scraperConfig.rateLimitMs || 1000;

    // Respect rate limiting
    await this.delay(delayMs);

    try {
      const url = this.buildSearchUrl(keywords, page, limit, scraperConfig);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobIngestionBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`Scraper error: ${response.status}`);
      }

      const html = await response.text();
      const jobs = this.parseJobs(html, scraperConfig);

      return {
        jobs,
        total: jobs.length,
        page,
        limit,
        hasMore: jobs.length >= limit,
        rateLimitRemaining: this.rateLimitRemaining,
      };
    } catch (error) {
      this.logger.error('Generic scraper search error', error);
      return { jobs: [], total: 0, page: 1, limit, hasMore: false };
    }
  }

  async fetchJobById(id: string): Promise<RawJobData | null> {
    const scraperConfig = this.scraperConfig;
    if (!scraperConfig) {
      throw new Error('Scraper configuration not set');
    }

    try {
      const url = scraperConfig.jobUrlPattern.replace('{id}', id);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobIngestionBot/1.0)',
        },
      });

      if (!response.ok) {
        return null;
      }

      const html = await response.text();
      return this.parseJobDetail(html, id, scraperConfig);
    } catch (error) {
      this.logger.error(`Error fetching job ${id}`, error);
      return null;
    }
  }

  private buildSearchUrl(keywords: string, page: number, limit: number, config: ScraperConfig): string {
    const url = new URL(config.searchUrl);
    
    switch (config.paginationType) {
      case 'offset':
        url.searchParams.set('offset', ((page - 1) * limit).toString());
        url.searchParams.set('limit', limit.toString());
        break;
      case 'page':
        url.searchParams.set('page', page.toString());
        if (config.itemsPerPage) {
          url.searchParams.set('per_page', config.itemsPerPage.toString());
        }
        break;
    }

    if (keywords) {
      url.searchParams.set('q', keywords);
      url.searchParams.set('search', keywords);
    }

    return url.toString();
  }

  private parseJobs(html: string, config: ScraperConfig): RawJobData[] {
    const jobs: RawJobData[] = [];
    
    // Use pre-compiled safe regex pattern for job list parsing
    const jobListPattern = this.getSafeJobListPattern(config.selectors.jobList);
    if (!jobListPattern) {
      return jobs;
    }
    
    let match;
    
    // Limit iterations to prevent ReDoS
    const maxIterations = 100;
    let iterations = 0;
    
    while ((match = jobListPattern.exec(html)) !== null && iterations < maxIterations) {
      iterations++;
      const jobHtml = match[1] || match[0];
      const job = this.parseJobElement(jobHtml, config);
      if (job) {
        jobs.push(job);
      }
    }

    return jobs;
  }

  private getSafeJobListPattern(selector: string): RegExp | null {
    // Check if selector is a pre-defined safe pattern
    const safePattern = SAFE_JOB_LIST_PATTERNS.find(p => p.source === selector);
    if (safePattern) {
      return safePattern;
    }
    
    // Validate and create safe regex from selector
    if (selector.startsWith('/') && selector.endsWith('/')) {
      const regexPattern = selector.slice(1, -1);
      if (isSafeRegexPattern(regexPattern)) {
        try {
          return new RegExp(regexPattern, 'gi');
        } catch {
          return null;
        }
      }
    }
    
    return null;
  }

  private parseJobElement(jobHtml: string, config: ScraperConfig): RawJobData | null {
    try {
      const titleMatch = this.extractField(jobHtml, config.selectors.jobTitle);
      const companyMatch = this.extractField(jobHtml, config.selectors.jobCompany);
      const locationMatch = this.extractField(jobHtml, config.selectors.jobLocation);
      const descriptionMatch = this.extractField(jobHtml, config.selectors.jobDescription);
      const urlMatch = this.extractField(jobHtml, config.selectors.jobUrl);
      const salaryMatch = config.selectors.jobSalary 
        ? this.extractField(jobHtml, config.selectors.jobSalary) 
        : null;
      const dateMatch = config.selectors.jobDate 
        ? this.extractField(jobHtml, config.selectors.jobDate) 
        : null;

      if (!titleMatch || !urlMatch) {
        return null;
      }

      return {
        title: this.cleanText(titleMatch),
        company: this.cleanText(companyMatch || ''),
        location: this.cleanText(locationMatch || ''),
        description: this.cleanText(descriptionMatch || ''),
        applyUrl: urlMatch.startsWith('http') ? urlMatch : `https://${urlMatch}`,
        salary: salaryMatch ? this.parseSalary(salaryMatch) : undefined,
        postedDate: dateMatch || new Date().toISOString(),
        source: this.sourceId,
        sourceUrl: urlMatch.startsWith('http') ? urlMatch : `https://${urlMatch}`,
      };
    } catch (error) {
      this.logger.error('Error parsing job element', error);
      return null;
    }
  }

  private parseJobDetail(html: string, id: string, config: ScraperConfig): RawJobData | null {
    const descriptionMatch = this.extractField(html, config.selectors.jobDescription);
    const titleMatch = this.extractField(html, config.selectors.jobTitle);
    const companyMatch = this.extractField(html, config.selectors.jobCompany);

    return {
      externalId: id,
      title: this.cleanText(titleMatch || ''),
      company: this.cleanText(companyMatch || ''),
      description: this.cleanText(descriptionMatch || ''),
      source: this.sourceId,
    };
  }

   private extractField(html: string, selector: string): string | null {
    // Handle both CSS selectors and regex patterns
    if (selector.startsWith('/') && selector.endsWith('/')) {
      const regexPattern = selector.slice(1, -1);
      try {
        // Validate regex pattern to prevent ReDoS
        if (!isSafeRegexPattern(regexPattern)) {
          return null;
        }
        
        const regex = new RegExp(regexPattern, 'i');
        // Limit the test input length to prevent ReDoS
        const testInput = html.slice(0, 2000);
        const match = testInput.match(regex);
        return match ? match[1] || match[0] : null;
      } catch {
        return null;
      }
    }

    // Simple tag-based extraction
    try {
      const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tagMatch = html.match(new RegExp(`<[^>]*class="[^"]*${escapedSelector}[^"]*"[^>]*>([^<]*)</[^>]*>`, 'i'));
      return tagMatch ? tagMatch[1] : null;
    } catch {
      return null;
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/&#\d+;/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseSalary(salaryStr: string): { min?: number; max?: number; currency?: string } | undefined {
    if (!salaryStr) return undefined;
    
    const cleaned = salaryStr.replace(/[^0-9.-]/g, ' ');
    const numbers = cleaned.split(/\s+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
    
    if (numbers.length === 0) return undefined;
    if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };
    
    return { min: Math.min(...numbers), max: Math.max(...numbers) };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  normalizeJob(job: RawJobData): JobPosting {
    const normalized = super.normalizeJob(job);
    (normalized as any).source = this.sourceId;
    (normalized as any).sourceUrl = job.sourceUrl;
    return normalized;
  }

  static createPrebuiltScrapers(): ScraperConfig[] {
    return [
      {
        name: 'Stack Overflow Jobs',
        baseUrl: 'https://stackoverflow.com',
        searchUrl: 'https://stackoverflow.com/jobs',
        jobUrlPattern: 'https://stackoverflow.com/jobs/{id}',
        selectors: {
          jobList: 'class="[-a-z]*job[-a-z]*"',
          jobTitle: 'job-title',
          jobCompany: 'job-company',
          jobLocation: 'job-location',
          jobDescription: 'job-description',
          jobUrl: 'job-url',
          nextPage: 'next-page',
        },
        paginationType: 'page',
        itemsPerPage: 20,
        rateLimitMs: 1500,
      },
      {
        name: 'GitHub Jobs',
        baseUrl: 'https://github.com',
        searchUrl: 'https://github.com/jobs',
        jobUrlPattern: 'https://github.com/jobs/{id}',
        selectors: {
          jobList: 'class="job-card"',
          jobTitle: 'job-title',
          jobCompany: 'company',
          jobLocation: 'location',
          jobDescription: 'description',
          jobUrl: 'apply-url',
        },
        paginationType: 'page',
        itemsPerPage: 30,
        rateLimitMs: 1000,
      },
    ];
  }
}
