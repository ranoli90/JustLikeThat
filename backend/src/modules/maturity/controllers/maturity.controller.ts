import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { DocumentationService } from '../services/documentation.service';
import { TrainingService } from '../services/training.service';
import { RunbookService } from '../services/runbook.service';
import { ReleaseManagementService } from '../services/release-management.service';
import { QualityAssuranceService } from '../services/quality-assurance.service';
import { SignOffService } from '../services/sign-off.service';
import { PlatformMetricsService } from '../services/platform-metrics.service';
import { FAQService } from '../services/faq.service';
import { KnowledgeTransferService } from '../services/knowledge-transfer.service';
import {
  CreateDocumentationDto,
  UpdateDocumentationDto,
  CreateTrainingMaterialDto,
  UpdateTrainingProgressDto,
  CreateRunbookDto,
  ExecuteRunbookDto,
  CreateReleasePlanDto,
  ReleaseApprovalDto,
  RollbackReleaseDto,
  CreateQAReportDto,
  CreateSignOffDto,
  SignOffActionDto,
  CreateFAQDto,
  UpdateFAQDto,
  CreateKnowledgeTransferDto,
  CreatePlatformMetricsDto,
  PaginationQueryDto,
} from '../dto/maturity.dto';

// Documentation endpoints
@Controller('api/v1/maturity/documentation')
export class DocumentationController {
  constructor(private readonly documentationService: DocumentationService) {}

  @Post()
  create(@Body() dto: CreateDocumentationDto) {
    return this.documentationService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto, @Query('category') category?: string, @Query('status') status?: string, @Query('search') search?: string) {
    return this.documentationService.findAll(query, { category, status, search });
  }

  @Get('stats')
  getStats() {
    return this.documentationService.getStats();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.documentationService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentationDto) {
    return this.documentationService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.documentationService.delete(id);
    return { message: 'Documentation deleted successfully' };
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.documentationService.publish(id);
  }

  @Post(':id/submit-review')
  submitForReview(@Param('id') id: string) {
    return this.documentationService.submitForReview(id);
  }

  @Post(':id/helpful')
  markHelpful(@Param('id') id: string) {
    return this.documentationService.markHelpful(id);
  }

  @Get('category/:category')
  findByCategory(@Param('category') category: string, @Query() query: PaginationQueryDto) {
    return this.documentationService.findByCategory(category, query);
  }
}

// Training endpoints
@Controller('api/v1/maturity/training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Post()
  createMaterial(@Body() dto: CreateTrainingMaterialDto) {
    return this.trainingService.createMaterial(dto);
  }

  @Get()
  findAllMaterials(@Query() query: PaginationQueryDto, @Query('type') type?: string, @Query('category') category?: string, @Query('difficulty') difficulty?: string, @Query('status') status?: string, @Query('search') search?: string) {
    return this.trainingService.findAllMaterials(query, { type, category, difficulty, status, search });
  }

  @Get('stats')
  getStats() {
    return this.trainingService.getStats();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.trainingService.findMaterialById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateTrainingMaterialDto>) {
    return this.trainingService.updateMaterial(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.trainingService.deleteMaterial(id);
    return { message: 'Training material deleted successfully' };
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.trainingService.publishMaterial(id);
  }

  @Get('progress/:userId')
  getUserProgress(@Param('userId') userId: string, @Query() query: PaginationQueryDto) {
    return this.trainingService.getUserProgress(userId, query);
  }

  @Put(':id/progress')
  updateProgress(@Param('id') id: string, @Body() dto: UpdateTrainingProgressDto) {
    return this.trainingService.updateProgress(id, dto.userId, dto);
  }
}

// Runbook endpoints
@Controller('api/v1/maturity/runbooks')
export class RunbookController {
  constructor(private readonly runbookService: RunbookService) {}

  @Post()
  create(@Body() dto: CreateRunbookDto) {
    return this.runbookService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto, @Query('category') category?: string, @Query('status') status?: string, @Query('priority') priority?: string, @Query('search') search?: string) {
    return this.runbookService.findAll(query, { category, status, priority, search });
  }

  @Get('stats')
  getStats() {
    return this.runbookService.getStats();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.runbookService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateRunbookDto>) {
    return this.runbookService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.runbookService.delete(id);
    return { message: 'Runbook deleted successfully' };
  }

  @Post(':id/execute')
  execute(@Param('id') id: string, @Body() dto: ExecuteRunbookDto) {
    return this.runbookService.execute(id, dto);
  }

  @Get(':id/executions')
  getExecutionHistory(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.runbookService.getExecutionHistory(id, query);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.runbookService.publish(id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.runbookService.archive(id);
  }

  @Get('user/:userId/executions')
  getUserExecutions(@Param('userId') userId: string, @Query() query: PaginationQueryDto) {
    return this.runbookService.getUserExecutions(userId, query);
  }
}

// Release management endpoints
@Controller('api/v1/maturity/releases')
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseManagementService) {}

  @Post()
  create(@Body() dto: CreateReleasePlanDto) {
    return this.releaseService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto, @Query('status') status?: string, @Query('riskLevel') riskLevel?: string, @Query('search') search?: string) {
    return this.releaseService.findAll(query, { status, riskLevel, search });
  }

  @Get('stats')
  getStats() {
    return this.releaseService.getStats();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.releaseService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateReleasePlanDto>) {
    return this.releaseService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.releaseService.delete(id);
    return { message: 'Release deleted successfully' };
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ReleaseApprovalDto) {
    return this.releaseService.addApproval(id, dto);
  }

  @Post(':id/deploy')
  deploy(@Param('id') id: string, @Body() body: { environment: string; deployedBy: string }) {
    return this.releaseService.deploy(id, body.environment, body.deployedBy);
  }

  @Post(':id/rollback')
  rollback(@Param('id') id: string, @Body() dto: RollbackReleaseDto) {
    return this.releaseService.rollback(id, dto);
  }

  @Post(':id/release')
  release(@Param('id') id: string) {
    return this.releaseService.release(id);
  }
}

// QA endpoints
@Controller('api/v1/maturity/qa')
export class QAController {
  constructor(private readonly qaService: QualityAssuranceService) {}

  @Post('reports')
  createReport(@Body() dto: CreateQAReportDto) {
    return this.qaService.createReport(dto);
  }

  @Get('reports')
  findAllReports(@Query() query: PaginationQueryDto, @Query('releaseId') releaseId?: string, @Query('testType') testType?: string, @Query('status') status?: string) {
    return this.qaService.findAllReports(query, { releaseId, testType, status });
  }

  @Get('reports/stats')
  getStats() {
    return this.qaService.getStats();
  }

  @Get('reports/:id')
  findById(@Param('id') id: string) {
    return this.qaService.findReportById(id);
  }

  @Post('reports/:id/update')
  updateStatus(@Param('id') id: string, @Body() body: { status: string; resolvedIssues?: any[] }) {
    return this.qaService.updateReportStatus(id, body.status, body.resolvedIssues);
  }

  @Post('execute')
  executeTests(@Body() body: { suiteId: string; environment: string }) {
    return this.qaService.executeTests(body.suiteId, body.environment);
  }

  @Get('reports/latest/:releaseId/:testType')
  getLatestReport(@Param('releaseId') releaseId: string, @Param('testType') testType: string) {
    return this.qaService.getLatestReport(releaseId, testType);
  }
}

// Sign-off endpoints
@Controller('api/v1/maturity/signoffs')
export class SignOffController {
  constructor(private readonly signoffService: SignOffService) {}

  @Post()
  create(@Body() dto: CreateSignOffDto) {
    return this.signoffService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto, @Query('stakeholderType') stakeholderType?: string, @Query('area') area?: string, @Query('status') status?: string) {
    return this.signoffService.findAll(query, { stakeholderType, area, status });
  }

  @Get('stats')
  getStats() {
    return this.signoffService.getStats();
  }

  @Get('overall')
  getOverallStatus() {
    return this.signoffService.getOverallStatus();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.signoffService.findById(id);
  }

  @Put(':id/approve')
  approve(@Param('id') id: string, @Body() dto: SignOffActionDto) {
    return this.signoffService.approve(id, dto);
  }

  @Put(':id/reject')
  reject(@Param('id') id: string, @Body() dto: SignOffActionDto) {
    return this.signoffService.reject(id, dto);
  }

  @Put(':id/request-revision')
  requestRevision(@Param('id') id: string, @Body() body: { comments: string }) {
    return this.signoffService.requestRevision(id, body.comments);
  }
}

// Platform metrics endpoints
@Controller('api/v1/maturity/metrics')
export class MetricsController {
  constructor(private readonly metricsService: PlatformMetricsService) {}

  @Post()
  create(@Body() dto: CreatePlatformMetricsDto) {
    return this.metricsService.create(dto);
  }

  @Get()
  findAll(@Query('limit') limit?: number) {
    return this.metricsService.findAll(limit);
  }

  @Get('latest')
  getLatest() {
    return this.metricsService.getLatest();
  }

  @Get('overall')
  getOverall() {
    return this.metricsService.getOverall();
  }

  @Get('health')
  getHealthStatus() {
    return this.metricsService.getHealthStatus();
  }
}

// FAQ endpoints
@Controller('api/v1/maturity/faq')
export class FAQController {
  constructor(private readonly faqService: FAQService) {}

  @Post()
  create(@Body() dto: CreateFAQDto) {
    return this.faqService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto, @Query('category') category?: string, @Query('status') status?: string, @Query('search') search?: string) {
    return this.faqService.findAll(query, { category, status, search });
  }

  @Get('stats')
  getStats() {
    return this.faqService.getStats();
  }

  @Get('categories')
  getCategories() {
    return this.faqService.getCategories();
  }

  @Get('search')
  search(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.faqService.search(query, limit);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.faqService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFAQDto) {
    return this.faqService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.faqService.delete(id);
    return { message: 'FAQ deleted successfully' };
  }

  @Post(':id/helpful')
  markHelpful(@Param('id') id: string) {
    return this.faqService.markHelpful(id);
  }

  @Post(':id/not-helpful')
  markNotHelpful(@Param('id') id: string) {
    return this.faqService.markNotHelpful(id);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.faqService.publish(id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.faqService.archive(id);
  }
}

// Knowledge transfer endpoints
@Controller('api/v1/maturity/knowledge-transfer')
export class KnowledgeTransferController {
  constructor(private readonly ktService: KnowledgeTransferService) {}

  @Post()
  create(@Body() dto: CreateKnowledgeTransferDto) {
    return this.ktService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto, @Query('type') type?: string, @Query('status') status?: string, @Query('search') search?: string) {
    return this.ktService.findAll(query, { type, status, search });
  }

  @Get('stats')
  getStats() {
    return this.ktService.getStats();
  }

  @Get('upcoming')
  getUpcoming(@Query('limit') limit?: number) {
    return this.ktService.getUpcoming(limit);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.ktService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateKnowledgeTransferDto>) {
    return this.ktService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.ktService.delete(id);
    return { message: 'Knowledge transfer deleted successfully' };
  }

  @Post(':id/schedule')
  schedule(@Param('id') id: string, @Body() body: { schedule: Record<string, unknown> }) {
    return this.ktService.schedule(id, body.schedule);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.ktService.complete(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.ktService.cancel(id);
  }
}
