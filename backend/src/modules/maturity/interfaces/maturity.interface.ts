// Simplified interfaces for Maturity Module (without Prisma dependencies)
export interface Documentation {
  id: string;
  category: string;
  title: string;
  content: string;
  version: string;
  lastUpdated: Date;
  author: string;
  status: string;
  tags: string[];
  views: number;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingMaterial {
  id: string;
  type: string;
  title: string;
  description: string;
  content: Record<string, unknown>;
  duration: number;
  difficulty: string;
  category: string;
  tags: string[];
  status: string;
  order: number;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingProgress {
  id: string;
  userId: string;
  materialId: string;
  progress: number;
  status: string;
  timeSpent: number;
  startedAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
}

export interface Runbook {
  id: string;
  category: string;
  title: string;
  content: string;
  version: string;
  lastUpdated: Date;
  author: string;
  status: string;
  tags: string[];
  priority: string;
  estimatedTime?: number;
  prerequisites: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RunbookExecution {
  id: string;
  runbookId: string;
  executedBy: string;
  status: string;
  notes?: string;
  output?: Record<string, unknown>;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
}

export interface ReleasePlan {
  id: string;
  version: string;
  name: string;
  description: string;
  status: string;
  scheduledDate?: Date;
  releaseNotes?: string;
  changelog: Record<string, unknown>[];
  riskLevel: string;
  rollbackPlan?: string;
  createdAt: Date;
  updatedAt: Date;
  releasedAt?: Date;
}

export interface QAReport {
  id: string;
  releaseId: string;
  testType: string;
  status: string;
  coverage: number;
  issues: Record<string, unknown>[];
  resolvedIssues: Record<string, unknown>[];
  executedBy: string;
  executedAt: Date;
  environment: string;
}

export interface SignOff {
  id: string;
  stakeholderType: string;
  stakeholderId: string;
  stakeholderName: string;
  area: string;
  status: string;
  comments?: string;
  evidence: Record<string, unknown>;
  conditions: string[];
  approvedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface PlatformMetrics {
  id: string;
  date: Date;
  uptime: number;
  performance: number;
  security: number;
  userSatisfaction: number;
  costEfficiency: number;
  overallScore: number;
  createdAt: Date;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  helpfulCount: number;
  notHelpfulCount: number;
  viewCount: number;
  status: string;
  createdAt: Date;
}

export interface KnowledgeTransfer {
  id: string;
  title: string;
  description: string;
  type: string;
  targetAudience: string[];
  objectives: string[];
  duration: number;
  materials: Record<string, unknown>[];
  status: string;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
