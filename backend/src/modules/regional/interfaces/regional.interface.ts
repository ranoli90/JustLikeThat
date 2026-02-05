// Regional Module Interfaces

export interface Region {
  code: string;
  name: string;
  timezone: string;
  timezoneOffset: number;
  countries: string[];
  defaultCurrency: string;
  supportedCurrencies: string[];
  defaultLocale: string;
  supportedLocales: string[];
  jobSources: JobSourceConfig[];
  salaryData: SalaryDataConfig;
  remoteWorkPolicy: string;
  complianceRules: ComplianceConfig;
  dataResidency: string;
  gdprEnabled: boolean;
  ccpaEnabled: boolean;
  basePrice: number;
  pppMultiplier: number;
  taxRate: number;
  isActive: boolean;
}

export interface JobSourceConfig {
  id: string;
  name: string;
  type: 'API' | 'RSS' | 'SCRAPER' | 'PARTNER' | 'AGGREGATOR';
  baseUrl: string;
  apiEndpoint: string;
  isActive: boolean;
  lastSyncAt: Date;
  totalJobs: number;
}

export interface SalaryDataConfig {
  sources: string[];
  coverage: number;
  updateFrequency: string;
}

export interface ComplianceConfig {
  regulations: string[];
  dataRetention: number;
  consentRequired: boolean;
}

export interface JobSearchParams {
  region?: string;
  keywords?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  isRemote?: boolean;
  timezone?: string;
  remoteTimezoneOverlap?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Job {
  id: string;
  externalId: string;
  source: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  city?: string;
  country: string;
  remoteType: 'onsite' | 'hybrid' | 'remote' | 'flexible';
  timezone?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  jobType: string;
  experienceLevel: string;
  skills: string[];
  benefits?: string[];
  companyName: string;
  companyLogo?: string;
  companySize?: string;
  industry?: string;
  postedAt: Date;
  expiresAt?: Date;
  applicationUrl: string;
  normalizedTitle?: string;
  category?: string;
}

export interface SalaryData {
  id: string;
  jobTitle: string;
  jobCategory?: string;
  experienceLevel?: string;
  skills: string[];
  regionCode: string;
  countryCode?: string;
  city?: string;
  isRemote: boolean;
  currency: string;
  minSalary: number;
  maxSalary: number;
  medianSalary?: number;
  averageSalary?: number;
  source: string;
  sampleSize?: number;
  confidence?: number;
  dataDate: Date;
}

export interface RemoteWorkFilter {
  timezone: string;
  overlapHours: number;
  overlapStart?: string;
  overlapEnd?: string;
}

export interface JobNormalizationResult {
  normalizedTitle: string;
  category: string;
  skills: string[];
  experienceLevel: string;
  jobType: string;
}

export interface RegionSalarySummary {
  regionCode: string;
  regionName: string;
  currency: string;
  averageMinSalary: number;
  averageMaxSalary: number;
  jobCount: number;
  topJobTitles: { title: string; count: number }[];
}
