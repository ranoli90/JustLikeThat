export enum AgentType {
  INGESTION = 'ingestion',
  MATCHING = 'matching',
  TAILORING = 'tailoring',
  APPLICATION = 'application',
  NOTIFICATION = 'notification',
}

export interface AgentPermissions {
  readonly [AgentType.INGESTION]: string[];
  readonly [AgentType.MATCHING]: string[];
  readonly [AgentType.TAILORING]: string[];
  readonly [AgentType.APPLICATION]: string[];
  readonly [AgentType.NOTIFICATION]: string[];
}

export const AGENT_PERMISSIONS: AgentPermissions = {
  [AgentType.INGESTION]: [
    'read:job-sources',
    'write:job-postings',
    'write:ingestion-logs',
  ],
  [AgentType.MATCHING]: [
    'read:candidate-profiles',
    'read:job-postings',
    'write:matching-results',
  ],
  [AgentType.TAILORING]: [
    'read:candidate-profiles',
    'read:resumes',
    'read:job-postings',
    'write:tailored-documents',
  ],
  [AgentType.APPLICATION]: [
    'read:candidate-profiles',
    'read:job-postings',
    'read:tailored-documents',
    'write:applications',
  ],
  [AgentType.NOTIFICATION]: [
    'read:candidate-profiles',
    'read:applications',
    'read:matching-results',
    'write:notifications',
  ],
};

export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  permissions: string[];
  retryCount: number;
  retryDelay: number; // ms
  fallbackAgent?: AgentType;
}

export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  [AgentType.INGESTION]: {
    type: AgentType.INGESTION,
    name: 'Ingestion Agent',
    description: 'Ingests and processes job postings from various sources',
    permissions: AGENT_PERMISSIONS[AgentType.INGESTION],
    retryCount: 3,
    retryDelay: 10000, // 10 seconds
  },
  [AgentType.MATCHING]: {
    type: AgentType.MATCHING,
    name: 'Matching Agent',
    description: 'Matches candidates with job postings based on profile compatibility',
    permissions: AGENT_PERMISSIONS[AgentType.MATCHING],
    retryCount: 2,
    retryDelay: 5000, // 5 seconds
  },
  [AgentType.TAILORING]: {
    type: AgentType.TAILORING,
    name: 'Tailoring Agent',
    description: 'Tailors resumes and cover letters to specific job postings',
    permissions: AGENT_PERMISSIONS[AgentType.TAILORING],
    retryCount: 2,
    retryDelay: 8000, // 8 seconds
  },
  [AgentType.APPLICATION]: {
    type: AgentType.APPLICATION,
    name: 'Application Agent',
    description: 'Submits applications to job portals on behalf of candidates',
    permissions: AGENT_PERMISSIONS[AgentType.APPLICATION],
    retryCount: 1,
    retryDelay: 3000, // 3 seconds
    fallbackAgent: AgentType.NOTIFICATION,
  },
  [AgentType.NOTIFICATION]: {
    type: AgentType.NOTIFICATION,
    name: 'Notification Agent',
    description: 'Sends notifications to candidates about application status and matches',
    permissions: AGENT_PERMISSIONS[AgentType.NOTIFICATION],
    retryCount: 5,
    retryDelay: 2000, // 2 seconds
  },
};

export interface AgentTask {
  id: string;
  agentType: AgentType;
  priority: TaskPriority;
  data: any;
  status: TaskStatus;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

export enum TaskErrorType {
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  EXTERNAL_API = 'external_api',
  UNKNOWN = 'unknown',
}
