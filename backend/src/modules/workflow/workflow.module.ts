import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowDefinitionService } from './services/workflow-definition.service';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { ConditionalBranchService } from './services/conditional-branch.service';
import { TriggerService } from './services/trigger.service';
import { ParallelExecutionService } from './services/parallel-execution.service';
import { WorkflowVersionService } from './services/workflow-version.service';
import { ErrorHandlingService } from './services/error-handling.service';
import { WorkflowTemplateService } from './services/workflow-template.service';

@Module({
  controllers: [WorkflowController],
  providers: [
    WorkflowDefinitionService,
    WorkflowExecutionService,
    ConditionalBranchService,
    TriggerService,
    ParallelExecutionService,
    WorkflowVersionService,
    ErrorHandlingService,
    WorkflowTemplateService,
  ],
  exports: [
    WorkflowDefinitionService,
    WorkflowExecutionService,
    ConditionalBranchService,
    TriggerService,
    ParallelExecutionService,
    WorkflowVersionService,
    ErrorHandlingService,
    WorkflowTemplateService,
  ],
})
export class WorkflowModule {}
