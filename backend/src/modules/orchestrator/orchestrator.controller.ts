import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { AgentType, TaskPriority, TaskStatus, TaskErrorType } from './orchestrator.agents';
import { OrchestratorTask } from './entities/orchestrator-task.entity';

@Controller('orchestrator')
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Post('tasks')
  async createTask(@Body('agentType') agentType: AgentType, @Body('data') data: any, @Body('priority') priority?: TaskPriority) {
    return this.orchestratorService.createTask(agentType, data, priority);
  }

  @Get('tasks/next')
  async getNextPendingTask(@Query('agentType') agentType?: AgentType) {
    return this.orchestratorService.getNextPendingTask(agentType);
  }

  @Put('tasks/:id/start')
  async startTask(@Param('id') id: string) {
    return this.orchestratorService.startTask(id);
  }

  @Put('tasks/:id/complete')
  async completeTask(@Param('id') id: string, @Body('result') result?: any) {
    return this.orchestratorService.completeTask(id, result);
  }

  @Put('tasks/:id/fail')
  async failTask(@Param('id') id: string, @Body('errorType') errorType: TaskErrorType, @Body('errorMessage') errorMessage: string) {
    return this.orchestratorService.failTask(id, errorType, errorMessage);
  }

  @Get('tasks/:id')
  async getTaskById(@Param('id') id: string) {
    return this.orchestratorService.getTaskById(id);
  }

  @Get('tasks')
  async getTasks(@Query('status') status?: TaskStatus, @Query('agentType') agentType?: AgentType, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.orchestratorService.getTasks(status, agentType, page, limit);
  }

  @Get('tasks/stats')
  async getTaskStats() {
    return this.orchestratorService.getTaskStats();
  }

  @Post('orchestrate/application')
  async orchestrateApplicationLifecycle(@Body('candidateId') candidateId: string, @Body('jobId') jobId: string) {
    return this.orchestratorService.orchestrateApplicationLifecycle(candidateId, jobId);
  }
}
