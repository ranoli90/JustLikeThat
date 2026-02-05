// DTOs for Maturity Module

import { IsString, IsOptional, IsArray, IsNumber, IsEnum, IsDate, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentationDto {
  @ApiProperty({ description: 'Documentation category' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Document title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Document content in markdown' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Document version' })
  @IsString()
  version: string;

  @ApiProperty({ description: 'Document author' })
  @IsString()
  author: string;

  @ApiPropertyOptional({ description: 'Document tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateDocumentationDto {
  @ApiPropertyOptional({ description: 'Documentation category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Document title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Document content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Document version' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Document status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Document tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateTrainingMaterialDto {
  @ApiProperty({ description: 'Training material type' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Training material title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Training material description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Training content' })
  @ValidateNested()
  @Type(() => Object)
  content: Record<string, unknown>;

  @ApiProperty({ description: 'Duration in minutes' })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({ description: 'Difficulty level' })
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty: string;

  @ApiProperty({ description: 'Training category' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: 'Training tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Material thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnail?: string;
}

export class UpdateTrainingProgressDto {
  @ApiProperty({ description: 'Progress percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiProperty({ description: 'Time spent in minutes' })
  @IsNumber()
  @Min(0)
  timeSpent: number;

  @ApiProperty({ description: 'Completion status' })
  @IsString()
  status: string;
}

export class CreateRunbookDto {
  @ApiProperty({ description: 'Runbook category' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Runbook title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Runbook content in markdown' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Runbook version' })
  @IsString()
  version: string;

  @ApiProperty({ description: 'Runbook author' })
  @IsString()
  author: string;

  @ApiProperty({ description: 'Runbook priority' })
  @IsEnum(['critical', 'high', 'medium', 'low'])
  priority: string;

  @ApiPropertyOptional({ description: 'Estimated time in minutes' })
  @IsOptional()
  @IsNumber()
  estimatedTime?: number;

  @ApiPropertyOptional({ description: 'Prerequisites' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiPropertyOptional({ description: 'Runbook tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ExecuteRunbookDto {
  @ApiProperty({ description: 'User executing the runbook' })
  @IsString()
  executedBy: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateReleasePlanDto {
  @ApiProperty({ description: 'Release version' })
  @IsString()
  version: string;

  @ApiProperty({ description: 'Release name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Release description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Scheduled release date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledDate?: Date;

  @ApiPropertyOptional({ description: 'Release notes' })
  @IsOptional()
  @IsString()
  releaseNotes?: string;

  @ApiProperty({ description: 'Changelog entries' })
  @IsArray()
  changelog: Record<string, unknown>[];

  @ApiProperty({ description: 'Risk level' })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  riskLevel: string;

  @ApiPropertyOptional({ description: 'Rollback plan' })
  @IsOptional()
  @IsString()
  rollbackPlan?: string;
}

export class ReleaseApprovalDto {
  @ApiProperty({ description: 'Approver role' })
  @IsString()
  approverRole: string;

  @ApiProperty({ description: 'Approver ID' })
  @IsString()
  approverId: string;

  @ApiProperty({ description: 'Approver name' })
  @IsString()
  approverName: string;

  @ApiProperty({ description: 'Approval status' })
  @IsEnum(['approved', 'rejected'])
  status: string;

  @ApiPropertyOptional({ description: 'Approval comments' })
  @IsOptional()
  @IsString()
  comments?: string;
}

export class RollbackReleaseDto {
  @ApiProperty({ description: 'Reason for rollback' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'User requesting rollback' })
  @IsString()
  rolledBackBy: string;
}

export class CreateQAReportDto {
  @ApiProperty({ description: 'Release ID' })
  @IsString()
  releaseId: string;

  @ApiProperty({ description: 'Test type' })
  @IsEnum(['functional', 'performance', 'security', 'accessibility', 'uat'])
  testType: string;

  @ApiProperty({ description: 'Test environment' })
  @IsString()
  environment: string;

  @ApiProperty({ description: 'Test coverage percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  coverage: number;

  @ApiProperty({ description: 'Issues found' })
  @IsArray()
  issues: Record<string, unknown>[];

  @ApiProperty({ description: 'Test executor' })
  @IsString()
  executedBy: string;
}

export class ExecuteQATestsDto {
  @ApiProperty({ description: 'Test suite ID' })
  @IsString()
  suiteId: string;

  @ApiProperty({ description: 'Environment to run tests on' })
  @IsString()
  environment: string;
}

export class CreateSignOffDto {
  @ApiProperty({ description: 'Stakeholder type' })
  @IsEnum(['executive', 'engineering', 'security', 'compliance', 'operations', 'product'])
  stakeholderType: string;

  @ApiProperty({ description: 'Stakeholder ID' })
  @IsString()
  stakeholderId: string;

  @ApiProperty({ description: 'Stakeholder name' })
  @IsString()
  stakeholderName: string;

  @ApiProperty({ description: 'Sign-off area' })
  @IsEnum(['performance', 'security', 'compliance', 'functionality', 'accessibility', 'overall'])
  area: string;

  @ApiPropertyOptional({ description: 'Evidence of completion' })
  @IsOptional()
  evidence?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Conditions for approval' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conditions?: string[];
}

export class SignOffActionDto {
  @ApiProperty({ description: 'Action status' })
  @IsEnum(['approved', 'rejected', 'needs_revision'])
  status: string;

  @ApiPropertyOptional({ description: 'Comments' })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({ description: 'Evidence of completion' })
  @IsOptional()
  evidence?: Record<string, unknown>;
}

export class CreateFAQDto {
  @ApiProperty({ description: 'FAQ question' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'FAQ answer' })
  @IsString()
  answer: string;

  @ApiProperty({ description: 'FAQ category' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: 'FAQ keywords' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}

export class UpdateFAQDto {
  @ApiPropertyOptional({ description: 'FAQ question' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ description: 'FAQ answer' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({ description: 'FAQ category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'FAQ keywords' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ description: 'FAQ status' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateKnowledgeTransferDto {
  @ApiProperty({ description: 'Knowledge transfer title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Knowledge transfer description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Transfer type' })
  @IsEnum(['workshop', 'seminar', 'hands_on', 'certification'])
  type: string;

  @ApiProperty({ description: 'Target audience' })
  @IsArray()
  @IsString({ each: true })
  targetAudience: string[];

  @ApiProperty({ description: 'Learning objectives' })
  @IsArray()
  @IsString({ each: true })
  objectives: string[];

  @ApiProperty({ description: 'Duration in minutes' })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({ description: 'Maximum participants' })
  @IsOptional()
  @IsNumber()
  maxParticipants?: number;

  @ApiPropertyOptional({ description: 'Materials' })
  @IsOptional()
  @IsArray()
  materials?: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Schedule' })
  @IsOptional()
  schedule?: Record<string, unknown>;
}

export class CreatePlatformMetricsDto {
  @ApiProperty({ description: 'Uptime percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  uptime: number;

  @ApiProperty({ description: 'Performance score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  performance: number;

  @ApiProperty({ description: 'Security score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  security: number;

  @ApiProperty({ description: 'User satisfaction score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  userSatisfaction: number;

  @ApiProperty({ description: 'Cost efficiency score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  costEfficiency: number;

  @ApiPropertyOptional({ description: 'Incidents count' })
  @IsOptional()
  @IsNumber()
  incidentsCount?: number;

  @ApiPropertyOptional({ description: 'Deployments count' })
  @IsOptional()
  @IsNumber()
  deploymentsCount?: number;

  @ApiPropertyOptional({ description: 'Issues resolved' })
  @IsOptional()
  @IsNumber()
  issuesResolved?: number;

  @ApiPropertyOptional({ description: 'New issues' })
  @IsOptional()
  @IsNumber()
  newIssues?: number;
}

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
