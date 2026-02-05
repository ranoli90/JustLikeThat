import { z } from 'zod';

// ============ WORKFLOW DEFINITION DTOs ============

export const CreateWorkflowDto = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  definition: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
      config: z.record(z.string(), z.any()),
    })),
    connections: z.array(z.object({
      source: z.string(),
      target: z.string(),
      sourceHandle: z.string().optional(),
      targetHandle: z.string().optional(),
    })),
    settings: z.object({
      entryPoint: z.string().optional(),
      exitPoint: z.string().optional(),
      parallelLimit: z.number().optional(),
      timeout: z.number().optional(),
    }).optional(),
  }),
});

export const UpdateWorkflowDto = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  definition: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
      config: z.record(z.string(), z.any()),
    })),
    connections: z.array(z.object({
      source: z.string(),
      target: z.string(),
      sourceHandle: z.string().optional(),
      targetHandle: z.string().optional(),
    })),
    settings: z.object({
      entryPoint: z.string().optional(),
      exitPoint: z.string().optional(),
      parallelLimit: z.number().optional(),
      timeout: z.number().optional(),
    }).optional(),
  }).optional(),
});

export const ExecuteWorkflowDto = z.object({
  input: z.record(z.string(), z.any()).optional(),
  trigger: z.string().optional(),
  version: z.number().optional(),
});

export const ScheduleWorkflowDto = z.object({
  cronExpression: z.string(),
  timezone: z.string().default('UTC'),
  priority: z.number().min(1).max(10).default(5),
  config: z.object({
    enabled: z.boolean().default(true),
    maxConcurrent: z.number().optional(),
  }).optional(),
});

export const RollbackWorkflowDto = z.object({
  version: z.number(),
  reason: z.string().optional(),
});

// ============ WORKFLOW QUERY DTOs ============

export const WorkflowQueryDto = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'version']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const ExecutionQueryDto = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED', 'CANCELLED']).optional(),
  workflowId: z.string().optional(),
  trigger: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export const ScheduleQueryDto = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['ACTIVE', 'PAUSED', 'DISABLED', 'FAILED']).optional(),
  workflowId: z.string().optional(),
});

// ============ WORKFLOW RESPONSE DTOs ============

export interface WorkflowResponse {
  id: string;
  name: string;
  description: string | null;
  version: number;
  definition: Record<string, any>;
  status: string;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface ExecutionResponse {
  id: string;
  workflowId: string;
  workflowName: string;
  version: number;
  status: string;
  trigger: string;
  input: Record<string, any>;
  output: Record<string, any> | null;
  error: Record<string, any> | null;
  startedAt: Date;
  completedAt: Date | null;
  executionTime: number | null;
  nodes: Record<string, any>;
}

export interface ScheduleResponse {
  id: string;
  workflowId: string;
  workflowName: string;
  cronExpression: string;
  timezone: string;
  status: string;
  lastRun: Date | null;
  nextRun: Date;
  priority: number;
  totalRuns: number;
  failedRuns: number;
}

export interface WorkflowTemplateResponse {
  id: string;
  name: string;
  description: string | null;
  category: string;
  definition: Record<string, any>;
  isPublic: boolean;
  usageCount: number;
}

export type CreateWorkflowDtoType = z.infer<typeof CreateWorkflowDto>;
export type UpdateWorkflowDtoType = z.infer<typeof UpdateWorkflowDto>;
export type ExecuteWorkflowDtoType = z.infer<typeof ExecuteWorkflowDto>;
export type ScheduleWorkflowDtoType = z.infer<typeof ScheduleWorkflowDto>;
export type RollbackWorkflowDtoType = z.infer<typeof RollbackWorkflowDto>;
export type WorkflowQueryDtoType = z.infer<typeof WorkflowQueryDto>;
export type ExecutionQueryDtoType = z.infer<typeof ExecutionQueryDto>;
export type ScheduleQueryDtoType = z.infer<typeof ScheduleQueryDto>;

