// I18n Interfaces and Types

export interface Locale {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  isActive: boolean;
  isDefault: boolean;
  fallbackLocale?: string;
  languageCode: string;
  territoryCode?: string;
  scriptCode?: string;
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  numberFormat?: NumberFormat;
  pluralRules?: string;
  translationCount: number;
  coveragePercent: number;
}

export interface NumberFormat {
  decimal: string;
  thousands: string;
  precision: number;
  currencyFormat?: string;
  percentFormat?: string;
}

export interface Translation {
  id: string;
  localeId: string;
  namespace: string;
  key: string;
  value: string;
  valueHtml?: string;
  isPlural: boolean;
  pluralIndex?: number;
  pluralValues?: Record<string, string>;
  translatedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  sourceLocale?: string;
  sourceValue?: string;
  machineTranslated: boolean;
  translationMemoryMatch?: number;
  usageCount: number;
  lastUsedAt?: Date;
  tenantId?: string;
  status: TranslationStatus;
  comment?: string;
}

export enum TranslationStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface TranslationRequest {
  locale: string;
  namespace: string;
  key: string;
  value: string;
  isPlural?: boolean;
  pluralIndex?: number;
  pluralValues?: Record<string, string>;
  comment?: string;
}

export interface TranslationSearchParams {
  locale?: string;
  namespace?: string;
  key?: string;
  status?: TranslationStatus;
  machineTranslated?: boolean;
  limit?: number;
  offset?: number;
}

export interface LanguageDetectionResult {
  locale: string;
  confidence: number;
  source: 'browser' | 'url' | 'user_preference' | 'ip';
}

export interface TranslationMemoryEntry {
  id: string;
  sourceLocale: string;
  sourceText: string;
  targetLocale: string;
  targetText: string;
  namespace?: string;
  context?: string;
  usageCount: number;
  matchType: MatchType;
  qualityScore: number;
}

export enum MatchType {
  EXACT = 'EXACT',
  FUZZY = 'FUZZY',
  PARTIAL = 'PARTIAL',
  MACHINE_ONLY = 'MACHINE_ONLY',
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  description?: string;
  locale: string;
  translations?: Record<string, string>;
  partOfSpeech?: string;
  domain?: string;
  usageExamples?: string[];
  isApproved: boolean;
  approvedBy?: string;
  parentId?: string;
  relatedTerms: string[];
}

export interface GlossaryEntry {
  id: string;
  glossaryId: string;
  term: string;
  abbreviation?: string;
  alternativeTerms: string[];
  locale: string;
  definition: string;
  notes?: string;
  status: string;
}

export interface TranslationWorkflow {
  id: string;
  localeId: string;
  namespace: string;
  stage: WorkflowStage;
  stageData?: Record<string, unknown>;
  assignedTo?: string;
  reviewerId?: string;
  approverId?: string;
  priority: number;
  dueAt?: Date;
  completedAt?: Date;
}

export enum WorkflowStage {
  DRAFT = 'DRAFT',
  TRANSLATION = 'TRANSLATION',
  REVIEW = 'REVIEW',
  APPROVAL = 'APPROVAL',
  PUBLISH = 'PUBLISH',
}

export interface NamespaceTranslation {
  namespace: string;
  translations: Record<string, string>;
  lastUpdated: Date;
  totalKeys: number;
  translatedKeys: number;
}

export interface TranslationStats {
  totalKeys: number;
  translatedKeys: number;
  reviewedKeys: number;
  approvedKeys: number;
  publishedKeys: number;
  coveragePercent: number;
  machineTranslatedCount: number;
  translationMemoryMatches: number;
}

export interface RTLConfiguration {
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  textAlign: 'left' | 'right';
  startEdge: 'left' | 'right';
  endEdge: 'right' | 'left';
  flexDirection: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  marginStart: string;
  marginEnd: string;
  paddingStart: string;
  paddingEnd: string;
  borderRadius: string;
}

export interface LanguageSwitchResult {
  fromLocale: string;
  toLocale: string;
  switchTime: number;
  cached: boolean;
  translationsLoaded: number;
}
