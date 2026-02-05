import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { TracingService } from './services/tracing.service';
import { MetricsService } from './services/metrics.service';
import { AlertingService } from './services/alerting.service';
import { SLOService } from './services/slo.service';
import { RemediationService } from './services/remediation.service';
import { LogService } from './services/log.service';

@Controller('api/v1')
export class MonitoringController {
  constructor(
    private readonly tracingService: TracingService,
    private readonly metricsService: MetricsService,
    private readonly alertingService: AlertingService,
    private readonly sloService: SLOService,
    private readonly remediationService: RemediationService,
    private readonly logService: LogService,
  ) {}

  // ==================== TRACING ENDPOINTS ====================

  @Get('tracing/trace/:traceId')
  async getTrace(@Param('traceId') traceId: string) {
    const trace = await this.tracingService.getTrace(traceId);
    if (!trace) {
      throw new HttpException('Trace not found', HttpStatus.NOT_FOUND);
    }
    return { trace };
  }

  @Get('tracing/services')
  async getServices() {
    const services = await this.tracingService.getServices();
    return { services };
  }

  @Get('tracing/operations')
  async getOperations(@Query('serviceName') serviceName: string) {
    if (!serviceName) {
      throw new HttpException('serviceName is required', HttpStatus.BAD_REQUEST);
    }
    const operations = await this.tracingService.getOperations(serviceName);
    return { operations };
  }

  @Post('tracing/search')
  async searchTraces(@Body() body: any) {
    const traces = await this.tracingService.searchTraces({
      serviceName: body.serviceName,
      operationName: body.operationName,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      minDuration: body.minDuration,
      limit: body.limit || 100,
      offset: body.offset || 0,
    });
    return traces;
  }

  @Get('tracing/stats/:traceId')
  async getTraceStats(@Param('traceId') traceId: string) {
    const stats = await this.tracingService.getTraceStats(traceId);
    return stats;
  }

  // ==================== METRICS ENDPOINTS ====================

  @Get('metrics/query')
  async queryMetrics(@Query() query: any) {
    const metrics = await this.metricsService.query({
      name: query.name,
      startTime: query.startTime ? new Date(query.startTime) : undefined,
      endTime: query.endTime ? new Date(query.endTime) : undefined,
    });
    return { metrics };
  }

  @Post('metrics/query_range')
  async queryMetricsRange(@Body() body: any) {
    const metrics = await this.metricsService.queryRange({
      name: body.name,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
    });
    return { metrics };
  }

  @Get('metrics/series')
  async getMetricSeries() {
    const names = await this.metricsService.getMetricNames();
    return { names };
  }

  @Get('metrics/label/:label/values')
  async getLabelValues(@Param('label') label: string) {
    const values = await this.metricsService.getLabelValues(label);
    return { values };
  }

  // ==================== ALERTING ENDPOINTS ====================

  @Get('alerts')
  async getAlerts(@Query() query: any) {
    const alerts = await this.alertingService.getAlerts({
      status: query.status,
      severity: query.severity,
      startTime: query.startTime ? new Date(query.startTime) : undefined,
      endTime: query.endTime ? new Date(query.endTime) : undefined,
      limit: query.limit,
      offset: query.offset,
    });
    return alerts;
  }

  @Get('alerts/rules')
  async getAlertRules() {
    const rules = await this.alertingService.getAlertRules();
    return { rules };
  }

  @Post('alerts/rules')
  async createAlertRule(@Body() body: any) {
    const id = await this.alertingService.createAlertRule(body);
    return { id };
  }

  @Put('alerts/rules/:id')
  async updateAlertRule(@Param('id') id: string, @Body() body: any) {
    await this.alertingService.updateAlertRule(id, body);
    return { success: true };
  }

  @Delete('alerts/rules/:id')
  async deleteAlertRule(@Param('id') id: string) {
    await this.alertingService.deleteAlertRule(id);
    return { success: true };
  }

  @Post('alerts/silence')
  async createSilence(@Body() body: any) {
    const id = await this.alertingService.createSilence({
      matchers: body.matchers,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      createdBy: body.createdBy,
      comment: body.comment,
    });
    return { id };
  }

  @Get('alerts/stats')
  async getAlertStats() {
    const stats = await this.alertingService.getAlertStats();
    return stats;
  }

  // ==================== SLO ENDPOINTS ====================

  @Get('slo')
  async getSLOs() {
    const slos = await this.sloService.getSLOs();
    return { slos };
  }

  @Post('slo')
  async createSLO(@Body() body: any) {
    const id = await this.sloService.createSLO(body);
    return { id };
  }

  @Get('slo/:id')
  async getSLO(@Param('id') id: string) {
    const slo = await this.sloService.getSLO(id);
    if (!slo) {
      throw new HttpException('SLO not found', HttpStatus.NOT_FOUND);
    }
    return { slo };
  }

  @Get('slo/:id/status')
  async getSLOStatus(@Param('id') id: string) {
    const status = await this.sloService.getSLOStatus(id);
    return status;
  }

  @Get('slo/:id/error-budget')
  async getErrorBudget(@Param('id') id: string) {
    const budget = await this.sloService.getErrorBudget(id);
    return budget;
  }

  @Get('slo/health')
  async getSLOHealthDashboard() {
    const health = await this.sloService.getSLOHealthDashboard();
    return health;
  }

  @Get('slo/:id/report')
  async generateSLOReport(@Param('id') id: string) {
    const report = await this.sloService.generateSLOReport(id);
    return report;
  }

  // ==================== REMEDIATION ENDPOINTS ====================

  @Get('remediation')
  async getRemediations() {
    const actions = await this.remediationService.getActions();
    const predefined = this.remediationService.getPredefinedActions();
    return { actions, predefined };
  }

  @Post('remediation')
  async createRemediation(@Body() body: any) {
    const id = await this.remediationService.createAction(body);
    return { id };
  }

  @Post('remediation/:id/execute')
  async executeRemediation(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const executionId = await this.remediationService.executeAction(
      id,
      body.triggerType || 'manual',
      body.triggerId,
    );
    return { executionId };
  }

  @Get('remediation/execution/:id')
  async getExecution(@Param('id') id: string) {
    const execution = await this.remediationService.getExecution(id);
    return execution;
  }

  @Get('remediation/stats')
  async getRemediationStats() {
    const stats = await this.remediationService.getRemediationStats();
    return stats;
  }

  // ==================== LOG ENDPOINTS ====================

  @Get('logs/search')
  async searchLogs(@Query() query: any) {
    const logs = await this.logService.searchLogs({
      serviceName: query.serviceName,
      level: query.level,
      traceId: query.traceId,
      startTime: query.startTime ? new Date(query.startTime) : undefined,
      endTime: query.endTime ? new Date(query.endTime) : undefined,
      message: query.message,
      limit: query.limit || 100,
      offset: query.offset || 0,
    });
    return logs;
  }

  @Get('logs/trace/:traceId')
  async getLogsByTrace(@Param('traceId') traceId: string) {
    const logs = await this.logService.getLogsByTraceId(traceId);
    return { logs };
  }

  @Get('logs/services')
  async getLogServices() {
    const services = await this.logService.getServices();
    return { services };
  }

  @Get('logs/stats')
  async getLogStats(
    @Query('serviceName') serviceName: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    if (!serviceName) {
      throw new HttpException('serviceName is required', HttpStatus.BAD_REQUEST);
    }

    const stats = await this.logService.getLogStats(
      serviceName,
      startTime ? new Date(startTime) : new Date(Date.now() - 3600000), // Last hour
      endTime ? new Date(endTime) : new Date(),
    );
    return stats;
  }
}
