// ============ WORKFLOW NODE TYPES ============

export enum NodeType {
  // Trigger Nodes
  TRIGGER_WEBHOOK = 'trigger.webhook',
  TRIGGER_SCHEDULE = 'trigger.schedule',
  TRIGGER_EVENT = 'trigger.event',
  TRIGGER_API = 'trigger.api',
  TRIGGER_MANUAL = 'trigger.manual',

  // Action Nodes
  ACTION_HTTP_REQUEST = 'action.http',
  ACTION_DATABASE = 'action.database',
  ACTION_EMAIL = 'action.email',
  ACTION_NOTIFICATION = 'action.notification',
  ACTION_TRANSFORM = 'action.transform',
  ACTION_SCRIPT = 'action.script',
  ACTION_SERVICE_CALL = 'action.service',

  // Logic Nodes
  CONDITION_IF = 'condition.if',
  CONDITION_SWITCH = 'condition.switch',
  CONDITION_FILTER = 'condition.filter',

  // Flow Control
  PARALLEL = 'flow.parallel',
  LOOP = 'flow.loop',
  SUBWORKFLOW = 'flow.subworkflow',
  PARALLEL_MERGE = 'flow.parallel_merge',
  DELAY = 'flow.delay',
  TERMINATOR = 'flow.terminator',

  // Error Handling
  ERROR_HANDLER = 'error.handler',
  COMPENSATION = 'error.compensation',
  RETRY = 'error.retry',
}

// ============ WORKFLOW DEFINITION INTERFACES ============

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: number;
  nodes: WorkflowNodeDefinition[];
  connections: WorkflowConnection[];
  settings: WorkflowSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowSettings {
  entryPoint?: string;
  exitPoint?: string;
  parallelLimit?: number;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  errorHandler?: string;
}

export interface WorkflowNodeDefinition {
  id: string;
  type: string;
  label: string;
  position: {
    x: number;
    y: number;
  };
  config: NodeConfig;
  validationRules?: ValidationRule[];
}

export interface NodeConfig {
  // Common
  description?: string;
  timeout?: number;
  retryPolicy?: RetryPolicy;

  // Trigger-specific
  triggerConfig?: TriggerConfig;

  // Action-specific
  actionConfig?: ActionConfig;

  // Condition-specific
  conditionConfig?: ConditionConfig;

  // Flow-specific
  flowConfig?: FlowConfig;

  // Error-specific
  errorConfig?: ErrorConfig;
}

export interface TriggerConfig {
  type: 'webhook' | 'schedule' | 'event' | 'api' | 'manual';
  webhookPath?: string;
  webhookSecret?: string;
  cronExpression?: string;
  timezone?: string;
  eventType?: string;
  eventFilter?: Record<string, any>;
  authType?: 'oauth2' | 'apikey' | 'jwt' | 'none';
  authConfig?: Record<string, any>;
}

export interface ActionConfig {
  method: string;
  endpoint?: string;
  headers?: Record<string, string>;
  body?: any;
  transformation?: TransformationRule[];
  outputMapping?: OutputMapping[];
}

export interface ConditionConfig {
  operator: ConditionOperator;
  conditions: ConditionGroup[];
  defaultBranch?: string;
  branches?: SwitchBranch[];
}

export interface ConditionGroup {
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface SwitchBranch {
  caseValue: any;
  branchId: string;
}

export interface FlowConfig {
  mode: 'sequential' | 'parallel' | 'fanout';
  parallelLimit?: number;
  loopConfig?: LoopConfig;
  subworkflowId?: string;
}

export interface LoopConfig {
  type: 'while' | 'until' | 'for' | 'foreach';
  iterations?: number;
  condition?: ConditionGroup[];
  collection?: string;
  continueOnError?: boolean;
}

export interface ErrorConfig {
  errorType: 'try_catch' | 'compensation' | 'retry';
  catchErrors?: string[];
  maxRetries?: number;
  backoffMs?: number;
  compensationActions?: CompensationAction[];
  fallbackAction?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelayMs: number;
  maxDelayMs: number;
  retryOn?: string[];
}

export interface CompensationAction {
  actionType: string;
  config: Record<string, any>;
  order: number;
}

// ============ WORKFLOW CONNECTION INTERFACES ============

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'default' | 'true' | 'false' | 'error';
  animated?: boolean;
  style?: Record<string, any>;
}

export interface NodeHandle {
  id: string;
  type: 'source' | 'target';
  position: 'top' | 'bottom' | 'left' | 'right';
  label?: string;
  required?: boolean;
  multiple?: boolean;
}

// ============ WORKFLOW EXECUTION INTERFACES ============

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  version: number;
  trigger: string;
  input: Record<string, any>;
  variables: Record<string, any>;
  state: ExecutionState;
  startedAt: Date;
  nodeStates: Map<string, NodeExecutionState>;
}

export interface ExecutionState {
  status: ExecutionStatus;
  currentNode?: string;
  completedNodes: string[];
  pendingNodes: string[];
  error?: ExecutionError;
}

export interface NodeExecutionState {
  nodeId: string;
  status: NodeExecutionStatus;
  input?: any;
  output?: any;
  error?: ExecutionError;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
}

export interface ExecutionError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
  nodeId?: string;
}

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  TIMEOUT = 'TIMEOUT',
}

export enum NodeExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  WAITING = 'WAITING',
}

// ============ CONDITION EVALUATION ============

export enum ConditionOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  REGEX = 'regex',
  BETWEEN = 'between',
  EXISTS = 'exists',
}

export interface Expression {
  type: 'literal' | 'variable' | 'function' | 'operator';
  value: any;
  path?: string;
}

export interface TransformationRule {
  inputPath: string;
  outputPath: string;
  transform?: string;
  defaultValue?: any;
}

export interface OutputMapping {
  source: string;
  target: string;
  transform?: string;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'pattern' | 'range' | 'custom';
  value: any;
  message: string;
}

// ============ WORKFLOW VERSIONING ============

export interface WorkflowVersion {
  version: number;
  definition: WorkflowDefinition;
  createdAt: Date;
  createdBy: string;
  changes?: VersionChange[];
}

export interface VersionChange {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  oldValue?: any;
  newValue?: any;
}

export interface WorkflowDiff {
  fromVersion: number;
  toVersion: number;
  changes: VersionChange[];
  summary: string;
}

// ============ SCHEDULING ============

export interface ScheduleConfig {
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  priority: number;
  maxConcurrent?: number;
  startDate?: Date;
  endDate?: Date;
  exceptions?: ScheduleException[];
}

export interface ScheduleException {
  date: Date;
  type: 'skip' | 'reschedule';
  newDate?: Date;
}

export interface ScheduleNextRun {
  scheduleId: string;
  nextRun: Date;
  workflowId: string;
}

// ============ PARALLEL EXECUTION ============

export interface ParallelExecution {
  id: string;
  parentExecutionId: string;
  branchId: string;
  nodes: string[];
  status: ExecutionStatus;
  results: Map<string, any>;
  startedAt: Date;
  completedAt?: Date;
}

export interface FanOutConfig {
  type: 'static' | 'dynamic';
  items: any[] | string;
  batchSize?: number;
  concurrency?: number;
}

export interface AggregationConfig {
  timeout: number;
  strategy: 'all' | 'first' | 'last' | 'custom';
  mergeStrategy?: 'merge' | 'array' | 'object';
}

// ============ WEBHOOK INTERFACES ============

export interface WebhookRequest {
  id: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  query: Record<string, string>;
  ip: string;
  timestamp: Date;
}

export interface WebhookResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

export interface WebhookValidation {
  valid: boolean;
  error?: string;
  payload?: any;
}

// ============ TEMPLATE INTERFACES ============

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  definition: WorkflowDefinition;
  isPublic: boolean;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: string[];
}
