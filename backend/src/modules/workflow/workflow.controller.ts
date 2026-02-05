import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { WorkflowDefinitionService } from './services/workflow-definition.service';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { WorkflowVersionService } from './services/workflow-version.service';
import { WorkflowTemplateService } from './services/workflow-template.service';
import { TriggerService } from './services/trigger.service';
import { ErrorHandlingService } from './services/error-handling.service';
import { v4 as uuidv4 } from 'uuid';

@Controller('api/v1/workflows')
export class WorkflowController {
  private readonly logger = new Logger(WorkflowController.name);

  constructor(
    private readonly workflowService: WorkflowDefinitionService,
    private readonly executionService: WorkflowExecutionService,
    private readonly versionService: WorkflowVersionService,
    private readonly templateService: WorkflowTemplateService,
    private readonly triggerService: TriggerService,
    private readonly errorService: ErrorHandlingService,
  ) {}

  private getMockUser() {
    return { id: uuidv4(), tenantId: uuidv4() };
  }

  // ============ WORKFLOW DEFINITION ENDPOINTS ============

  @Get()
  async getWorkflows(
    @Query() query: Record<string, any>,
  ) {
    const user = this.getMockUser();
    return this.workflowService.findAll(query as any, user.tenantId);
  }

  @Post()
  async createWorkflow(@Body() dto: Record<string, any>) {
    const user = this.getMockUser();
    return this.workflowService.create(dto as any, user.tenantId, user.id);
  }

  @Get(':id')
  async getWorkflow(@Param('id') id: string) {
    const user = this.getMockUser();
    return this.workflowService.findById(id, user.tenantId);
  }

  @Put(':id')
  async updateWorkflow(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
  ) {
    const user = this.getMockUser();
    return this.workflowService.update(id, dto as any, user.id);
  }

  @Delete(':id')
  async deleteWorkflow(@Param('id') id: string) {
    const user = this.getMockUser();
    await this.workflowService.delete(id, user.tenantId);
    return { success: true };
  }

  @Post(':id/publish')
  async publishWorkflow(@Param('id') id: string) {
    const user = this.getMockUser();
    return this.workflowService.publish(id, user.id);
  }

  @Post(':id/rollback')
  async rollbackWorkflow(
    @Param('id') id: string,
    @Body() body: { version: number; reason?: string },
  ) {
    const user = this.getMockUser();
    return this.workflowService.rollback(id, body.version, user.id);
  }

  @Post(':id/duplicate')
  async duplicateWorkflow(
    @Param('id') id: string,
    @Body() body: { name: string },
  ) {
    const user = this.getMockUser();
    return this.workflowService.duplicate(id, body.name, user.tenantId, user.id);
  }

  @Post(':id/auto-save')
  async autoSaveWorkflow(
    @Param('id') id: string,
    @Body() body: { definition: any },
  ) {
    await this.workflowService.autoSave(id, body.definition);
    return { success: true };
  }

  // ============ WORKFLOW EXECUTION ENDPOINTS ============

  @Post(':id/execute')
  async executeWorkflow(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @Query('trigger') trigger?: string,
  ) {
    const user = this.getMockUser();
    return this.executionService.execute(
      id,
      dto as any,
      trigger || 'MANUAL',
      user.tenantId,
    );
  }

  @Get(':id/executions')
  async getWorkflowExecutions(
    @Param('id') id: string,
    @Query() query: Record<string, any>,
  ) {
    const user = this.getMockUser();
    return this.executionService.getExecutions({ ...query, workflowId: id } as any, user.tenantId);
  }

  // ============ EXECUTION ENDPOINTS ============

  @Get('executions/list')
  async getExecutions(@Query() query: Record<string, any>) {
    const user = this.getMockUser();
    return this.executionService.getExecutions(query as any, user.tenantId);
  }

  @Get('executions/:id')
  async getExecution(@Param('id') id: string) {
    const user = this.getMockUser();
    return this.executionService.getExecution(id, user.tenantId);
  }

  @Post('executions/:id/cancel')
  async cancelExecution(@Param('id') id: string) {
    const user = this.getMockUser();
    await this.executionService.cancelExecution(id, user.tenantId);
    return { success: true };
  }

  @Post('executions/:id/retry')
  async retryExecution(@Param('id') id: string) {
    const user = this.getMockUser();
    return this.executionService.retryExecution(id, user.tenantId);
  }

  // ============ VERSION ENDPOINTS ============

  @Get(':id/versions')
  async getVersionHistory(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.versionService.getVersionHistory(id, { limit, offset });
  }

  @Get(':id/versions/:version')
  async getVersion(
    @Param('id') id: string,
    @Param('version') version: string,
  ) {
    return this.versionService.getVersion(id, parseInt(version, 10));
  }

  @Get(':id/versions/:from/compare/:to')
  async compareVersions(
    @Param('id') id: string,
    @Param('from') fromVersion: string,
    @Param('to') toVersion: string,
  ) {
    return this.versionService.compareVersions(
      id,
      parseInt(fromVersion, 10),
      parseInt(toVersion, 10),
    );
  }

  @Get(':id/audit')
  async getAuditTrail(
    @Param('id') id: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('performedBy') performedBy?: string,
  ) {
    return this.versionService.getAuditTrail(id, {
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      performedBy,
    });
  }

  // ============ SCHEDULE ENDPOINTS ============

  @Post(':id/schedule')
  async scheduleWorkflow(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
  ) {
    const user = this.getMockUser();
    return this.triggerService.createScheduleTrigger(
      id,
      {
        cronExpression: dto.cronExpression,
        timezone: dto.timezone || 'UTC',
        priority: dto.priority || 5,
      },
      user.tenantId,
      user.id,
    );
  }

  @Get('schedules')
  async getSchedules(@Query() query: Record<string, any>) {
    return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  @Put('schedules/:id')
  async updateSchedule(
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return { id, ...body };
  }

  @Delete('schedules/:id')
  async deleteSchedule(@Param('id') id: string) {
    return { success: true };
  }

  // ============ TEMPLATE ENDPOINTS ============

  @Get('templates/list')
  async getTemplates(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.templateService.getTemplates({ category, search, page, limit });
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return this.templateService.getTemplate(id);
  }

  @Post('templates')
  async createTemplate(
    @Body() body: Record<string, any>,
  ) {
    const user = this.getMockUser();
    return this.templateService.createTemplate({
      ...body,
      tenantId: user.tenantId,
      createdBy: user.id,
    });
  }

  @Post('templates/:id/duplicate')
  async duplicateTemplate(
    @Param('id') id: string,
    @Body() body: { name: string },
  ) {
    const user = this.getMockUser();
    return this.templateService.duplicateTemplate(id, body.name, user.tenantId, user.id);
  }

  @Post('templates/:id/create-workflow')
  async createWorkflowFromTemplate(
    @Param('id') id: string,
    @Body() body: { workflowName: string },
  ) {
    const user = this.getMockUser();
    return this.templateService.createFromTemplate(
      id,
      body.workflowName,
      user.tenantId,
      user.id,
    );
  }

  @Get('templates/categories')
  async getTemplateCategories() {
    return this.templateService.getCategories();
  }

  // ============ ERROR HANDLING ENDPOINTS ============

  @Get('dead-letter')
  async getDeadLetterQueue(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.errorService.getManualInterventionItems();
  }

  @Post('dead-letter/:id/resolve')
  async resolveDeadLetter(
    @Param('id') id: string,
    @Body() body: { resolution: string },
  ) {
    const user = this.getMockUser();
    await this.errorService.resolveManualIntervention(id, body.resolution, user.id);
    return { success: true };
  }

  @Post('dead-letter/:id/retry')
  async retryDeadLetter(
    @Param('id') id: string,
    @Body() body: { executionId: string; nodeId: string },
  ) {
    return this.errorService.retryFromPoint(body.executionId, body.nodeId);
  }

  // ============ TRIGGER ENDPOINTS ============

  @Get(':id/triggers')
  async getWorkflowTriggers(@Param('id') id: string) {
    return this.triggerService.getWorkflowTriggers(id);
  }

  @Post(':id/triggers/webhook')
  async createWebhookTrigger(
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    const user = this.getMockUser();
    return this.triggerService.createWebhookTrigger(id, body, user.tenantId);
  }

  @Post(':id/triggers/event')
  async createEventTrigger(
    @Param('id') id: string,
    @Body() body: { eventType: string; eventFilter?: Record<string, any> },
  ) {
    const user = this.getMockUser();
    const triggerId = await this.triggerService.createEventTrigger(id, body, user.tenantId);
    return { triggerId };
  }

  @Post(':id/triggers/api')
  async createApiTrigger(
    @Param('id') id: string,
    @Body() body: { authType: string; authConfig?: Record<string, any> },
  ) {
    const user = this.getMockUser();
    return this.triggerService.createApiTrigger(id, body, user.tenantId);
  }

  @Delete('triggers/:triggerId')
  async deleteTrigger(@Param('triggerId') triggerId: string) {
    await this.triggerService.deleteTrigger(triggerId);
    return { success: true };
  }
}
