import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { ExecuteWorkflowDtoType, ExecutionQueryDtoType } from '../dto/workflow.dto';
import { 
  ExecutionStatus, 
  NodeExecutionStatus,
  ExecutionContext,
  NodeExecutionState,
  ExecutionError 
} from '../interfaces/workflow.interface';
import { v4 as uuidv4 } from 'uuid';

interface ExecutionStateData {
  status: ExecutionStatus;
  currentNode?: string;
  completedNodes: string[];
  pendingNodes: string[];
  error?: ExecutionError;
}

@Injectable()
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);
  private readonly EXECUTION_TIMEOUT = 3600000; // 1 hour default
  private readonly NODE_TIMEOUT = 300000; // 5 minutes per node

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    workflowId: string,
    dto: ExecuteWorkflowDtoType,
    trigger: string,
    tenantId: string,
  ): Promise<any> {
    this.logger.log(`Executing workflow: ${workflowId}, trigger: ${trigger}`);

    const workflow = await this.prisma.workflowDefinition.findFirst({
      where: { id: workflowId, tenantId },
      include: { nodes: true },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${workflowId} not found`);
    }

    if (workflow.status !== 'PUBLISHED') {
      throw new BadRequestException('Can only execute published workflows');
    }

    const executionId = uuidv4();
    const definition = workflow.definition as any;
    const timeout = definition.settings?.timeout || this.EXECUTION_TIMEOUT;

    // Initialize execution context
    const context: ExecutionContext = {
      executionId,
      workflowId,
      version: dto.version || workflow.version,
      trigger,
      input: dto.input || {},
      variables: {},
      state: {
        status: ExecutionStatus.RUNNING,
        completedNodes: [],
        pendingNodes: this.getExecutionOrder(definition),
      } as ExecutionStateData,
      startedAt: new Date(),
      nodeStates: new Map<string, NodeExecutionState>(),
    };

    // Create execution record
    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId,
        version: context.version,
        status: 'RUNNING',
        trigger,
        input: dto.input as any,
        nodes: {},
      },
    });

    // Execute workflow
    try {
      const result = await this.runWorkflow(context, definition);
      
      await this.completeExecution(execution.id, result, null);
      
      return {
        executionId: execution.id,
        status: 'COMPLETED',
        output: result,
      };
    } catch (error) {
      const errorDetails = this.formatError(error);
      await this.completeExecution(execution.id, null, errorDetails);
      
      // Send to dead letter queue if needed
      if (this.shouldSendToDLQ(error)) {
        await this.sendToDeadLetterQueue(execution.id, workflowId, errorDetails, dto.input);
      }

      throw error;
    }
  }

  async getExecution(executionId: string, tenantId: string): Promise<any> {
    const execution = await this.prisma.workflowExecution.findFirst({
      where: { 
        id: executionId,
        workflow: { tenantId },
      },
      include: {
        workflow: {
          select: { name: true },
        },
      },
    });

    if (!execution) {
      throw new NotFoundException(`Execution with ID ${executionId} not found`);
    }

    return execution;
  }

  async getExecutions(query: ExecutionQueryDtoType, tenantId: string) {
    const { page, limit, status, workflowId, trigger, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      workflow: { tenantId },
    };

    if (status) where.status = status;
    if (workflowId) where.workflowId = workflowId;
    if (trigger) where.trigger = trigger;
    if (fromDate || toDate) {
      where.startedAt = {};
      if (fromDate) where.startedAt.gte = new Date(fromDate);
      if (toDate) where.startedAt.lte = new Date(toDate);
    }

    const [executions, total] = await Promise.all([
      this.prisma.workflowExecution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          workflow: {
            select: { name: true },
          },
        },
      }),
      this.prisma.workflowExecution.count({ where }),
    ]);

    return {
      data: executions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async cancelExecution(executionId: string, tenantId: string): Promise<void> {
    const execution = await this.getExecution(executionId, tenantId);

    if (execution.status !== 'RUNNING') {
      throw new BadRequestException('Can only cancel running executions');
    }

    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });

    await this.logExecution(executionId, null, 'INFO', 'Execution cancelled by user', {});
  }

  async retryExecution(executionId: string, tenantId: string): Promise<any> {
    const execution = await this.getExecution(executionId, tenantId);

    if (execution.status !== 'FAILED') {
      throw new BadRequestException('Can only retry failed executions');
    }

    // Get workflow again
    const workflow = await this.prisma.workflowDefinition.findFirst({
      where: { id: execution.workflowId, tenantId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return this.execute(
      execution.workflowId,
      { input: execution.input as any },
      'RETRY',
      tenantId,
    );
  }

  // ============ PRIVATE METHODS ============

  private async runWorkflow(context: ExecutionContext, definition: any): Promise<any> {
    const nodes = definition.nodes;
    const connections = definition.connections || [];

    // Find entry point (trigger node)
    const entryPoint = nodes.find((n: any) => n.type.startsWith('trigger.'));
    
    if (!entryPoint) {
      throw new Error('No trigger node found in workflow');
    }

    // Execute nodes in order
    let currentNode = entryPoint;
    const outputs: Map<string, any> = new Map();

    while (currentNode) {
      const nodeId = currentNode.id;
      context.state.currentNode = nodeId;

      // Initialize node state
      const nodeState: NodeExecutionState = {
        nodeId,
        status: NodeExecutionStatus.RUNNING,
        attempts: 0,
        input: outputs.get(nodeId) || context.input,
        startedAt: new Date(),
      };

      try {
        const result = await this.executeNode(currentNode, context, outputs);
        
        nodeState.status = NodeExecutionStatus.COMPLETED;
        nodeState.output = result;
        nodeState.completedAt = new Date();
        
        context.state.completedNodes.push(nodeId);
        outputs.set(nodeId, result);

        // Find next node
        currentNode = this.findNextNode(currentNode.id, connections, outputs);
      } catch (error) {
        nodeState.status = NodeExecutionStatus.FAILED;
        nodeState.error = this.formatError(error);
        nodeState.completedAt = new Date();
        
        throw error;
      } finally {
        context.nodeStates.set(nodeId, nodeState);
      }
    }

    return outputs.get('output') || {};
  }

  private async executeNode(node: any, context: ExecutionContext, outputs: Map<string, any>): Promise<any> {
    const nodeConfig = node.config || {};
    const timeout = nodeConfig.timeout || this.NODE_TIMEOUT;

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Node execution timeout')), timeout);
    });

    // Execute based on node type
    const executionPromise = this.executeNodeAction(node, context, outputs);

    return Promise.race([executionPromise, timeoutPromise]);
  }

  private async executeNodeAction(node: any, context: ExecutionContext, outputs: Map<string, any>): Promise<any> {
    const nodeType = node.type;

    if (nodeType.startsWith('trigger.')) {
      return this.executeTriggerNode(node, context);
    }

    if (nodeType.startsWith('action.')) {
      return this.executeActionNode(node, context, outputs);
    }

    if (nodeType.startsWith('condition.')) {
      return this.executeConditionNode(node, context, outputs);
    }

    if (nodeType.startsWith('flow.')) {
      return this.executeFlowNode(node, context, outputs);
    }

    if (nodeType.startsWith('error.')) {
      return this.executeErrorNode(node, context, outputs);
    }

    throw new Error(`Unknown node type: ${nodeType}`);
  }

  private async executeTriggerNode(node: any, context: ExecutionContext): Promise<any> {
    // Trigger nodes just pass through the input
    return context.input;
  }

  private async executeActionNode(node: any, context: ExecutionContext, outputs: Map<string, any>): Promise<any> {
    const config = node.config || {};
    const actionType = config.actionType || node.type;

    switch (actionType) {
      case 'action.http':
        return this.executeHttpAction(config, context);
      case 'action.email':
        return this.executeEmailAction(config, context);
      case 'action.database':
        return this.executeDatabaseAction(config, context, outputs);
      case 'action.transform':
        return this.executeTransformAction(config, context, outputs);
      case 'action.script':
        return this.executeScriptAction(config, context, outputs);
      default:
        return this.executeGenericAction(config, context);
    }
  }

  private async executeHttpAction(config: any, context: ExecutionContext): Promise<any> {
    const { method, endpoint, headers, body } = config;
    
    // Simulated HTTP request - in production, use actual HTTP client
    this.logger.log(`HTTP ${method} ${endpoint}`);

    // Return mock response
    return {
      status: 200,
      data: { message: 'Success', input: context.input },
    };
  }

  private async executeEmailAction(config: any, context: ExecutionContext): Promise<any> {
    const { to, subject, body } = config;
    
    this.logger.log(`Sending email to: ${to}, subject: ${subject}`);
    
    return {
      sent: true,
      to,
      subject,
      timestamp: new Date().toISOString(),
    };
  }

  private async executeDatabaseAction(config: any, context: ExecutionContext, outputs: Map<string, any>): Promise<any> {
    const { operation, table, data } = config;
    
    this.logger.log(`Database ${operation} on ${table}`);
    
    return { affected: 1, operation };
  }

  private async executeTransformAction(config: any, context: ExecutionContext, outputs: Map<string, any>): Promise<any> {
    const { transformations } = config || {};
    
    let result = context.input;
    
    if (transformations) {
      for (const transform of transformations) {
        const value = this.getValueByPath(result, transform.inputPath);
        this.setValueByPath(result, transform.outputPath, value);
      }
    }
    
    return result;
  }

  private async executeScriptAction(config: any, context: ExecutionContext, outputs: Map<string, any>): Promise<any> {
    const { script, language } = config;
    
    this.logger.log(`Executing ${language} script`);
    
    // In production, use sandboxed script execution
    return { executed: true, language };
  }

  private async executeGenericAction(config: any, context: ExecutionContext): Promise<any> {
    return { success: true, input: context.input };
  }

  private async executeConditionNode(node: any, context: ExecutionContext, outputs: Map<string, any>): Promise<any> {
    const config = node.config || {};
    const conditions = config.conditions || [];

    // Evaluate conditions
    let result = false;
    
    for (const condition of conditions) {
      const field = this.resolveValue(condition.field, context, outputs);
      const value = condition.value;
      const operator = condition.operator;

      result = this.evaluateCondition(field, operator, value);

      if (condition.logicalOperator === 'OR' && result) break;
      if (condition.logicalOperator === 'AND' && !result) break;
    }

    return { branch: result ? 'true' : 'false', result };
  }

  private async executeFlowNode(node: any, context: ExecutionContext, outputs: Map<string, any>): Promise<any> {
    const config = node.config || {};
    const flowType = config.flowType || node.type;

    switch (flowType) {
      case 'flow.delay':
        return this.executeDelay(config, context);
      case 'flow.loop':
        return this.executeLoop(config, context, outputs);
      case 'flow.parallel':
        return this.executeParallel(config, context, outputs);
      case 'flow.subworkflow':
        return this.executeSubworkflow(config, context);
      case 'flow.parallel_merge':
        return this.executeParallelMerge(config, context, outputs);
      default:
        return context.input;
    }
  }

  private async executeDelay(config: any, context: ExecutionContext): Promise<any> {
    const delayMs = config.delayMs || 1000;
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return context.input;
  }

  private async executeLoop(config: any, context: ExecutionContext, outputs: Map<string, any>): Promise<any> {
    const loopConfig = config.loopConfig || {};
    const iterations = loopConfig.iterations || 10;
    const results: any[] = [];

    for (let i = 0; i < iterations; i++) {
      results.push({ iteration: i, input: context.input });
    }

    return { iterations: results.length, results };
  }

  private async executeParallel(config: any, context: ExecutionContext, outputs: Map<string, any>): Promise<any> {
    const { items, concurrency } = config;
    
    // Fan-out/fan-in pattern
    const results = await Promise.all(
      items.map(async (item: any) => {
        return { item, result: context.input };
      })
    );

    return { parallel: true, count: results.length, results };
  }

  private async executeSubworkflow(config: any, context: ExecutionContext): Promise<any> {
    const subworkflowId = config.subworkflowId;
    
    this.logger.log(`Executing subworkflow: ${subworkflowId}`);
    
    return { subworkflowId, executed: true };
  }

  private async executeParallelMerge(config: any, context: ExecutionContext, outputs: Map<string, any>): Promise<any> {
    return { merged: true, input: context.input };
  }

  private async executeErrorNode(node: any, context: ExecutionContext, outputs: Map<string, any>): Promise<any> {
    const config = node.config || {};
    
    return { handled: true, type: config.errorType };
  }

  private async completeExecution(executionId: string, output: any, error: any): Promise<void> {
    const completedAt = new Date();
    
    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: error ? 'FAILED' : 'COMPLETED',
        output: output as any,
        error: error as any,
        completedAt,
        executionTime: Date.now() - completedAt.getTime(),
      },
    });
  }

  private async logExecution(
    executionId: string,
    nodeId: string | null,
    level: string,
    message: string,
    data: Record<string, any>,
  ): Promise<void> {
    await this.prisma.workflowExecutionLog.create({
      data: {
        executionId,
        nodeId,
        level: level as any,
        message,
        data: data as any,
      },
    });
  }

  private async sendToDeadLetterQueue(
    executionId: string,
    workflowId: string,
    error: ExecutionError,
    input: any,
  ): Promise<void> {
    await this.prisma.workflowDeadLetter.create({
      data: {
        executionId,
        workflowId,
        error: error as any,
        input: input as any,
        status: 'PENDING',
      },
    });
  }

  private getExecutionOrder(definition: any): string[] {
    // Simple topological sort for execution order
    const nodes = definition.nodes || [];
    const connections = definition.connections || [];
    
    // Get all node IDs
    const nodeIds = nodes.map((n: any) => n.id);
    
    // Find trigger nodes (entry points)
    const triggers = nodes.filter((n: any) => n.type.startsWith('trigger.')).map((n: any) => n.id);
    
    if (triggers.length === 0) return nodeIds;
    
    // Simple BFS to determine execution order
    const order: string[] = [...triggers];
    const visited = new Set<string>(triggers);
    
    for (let i = 0; i < order.length; i++) {
      const current = order[i];
      
      // Find all connections from current node
      const outgoing = connections
        .filter((c: any) => c.source === current)
        .map((c: any) => c.target);
      
      for (const target of outgoing) {
        if (!visited.has(target)) {
          visited.add(target);
          order.push(target);
        }
      }
    }
    
    return order;
  }

  private findNextNode(nodeId: string, connections: any[], outputs: Map<string, any>): any | null {
    const outgoing = connections.filter((c: any) => c.source === nodeId);
    
    if (outgoing.length === 0) return null;
    
    // For simple linear flow, return first connection
    // For branching, would need to evaluate conditions
    return outgoing[0]?.target || null;
  }

  private evaluateCondition(field: any, operator: string, value: any): boolean {
    switch (operator) {
      case 'eq': return field === value;
      case 'ne': return field !== value;
      case 'gt': return field > value;
      case 'gte': return field >= value;
      case 'lt': return field < value;
      case 'lte': return field <= value;
      case 'contains': return String(field).includes(value);
      case 'not_contains': return !String(field).includes(value);
      case 'starts_with': return String(field).startsWith(value);
      case 'ends_with': return String(field).endsWith(value);
      case 'in': return Array.isArray(value) && value.includes(field);
      case 'not_in': return Array.isArray(value) && !value.includes(field);
      case 'is_null': return field === null || field === undefined;
      case 'is_not_null': return field !== null && field !== undefined;
      case 'is_empty': return field === '' || field === null || field === undefined;
      case 'is_not_empty': return field !== '' && field !== null && field !== undefined;
      default: return false;
    }
  }

  private resolveValue(path: string, context: ExecutionContext, outputs: Map<string, any>): any {
    if (path.startsWith('inputs.')) {
      return this.getValueByPath(context.input, path.replace('inputs.', ''));
    }
    if (path.startsWith('variables.')) {
      return this.getValueByPath(context.variables, path.replace('variables.', ''));
    }
    if (path.startsWith('outputs.')) {
      const nodeId = path.split('.')[1];
      return outputs.get(nodeId);
    }
    return path;
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setValueByPath(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    let current = obj;
    for (const key of keys) {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return;
      }
      current = current[key] = current[key] || {};
    }
    
    // Prevent prototype pollution for last key
    if (lastKey !== '__proto__' && lastKey !== 'constructor' && lastKey !== 'prototype') {
      current[lastKey!] = value;
    }
  }

  private formatError(error: any): ExecutionError {
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || String(error),
      details: error.details,
      stack: error.stack,
    };
  }

  private shouldSendToDLQ(error: any): boolean {
    // Send to DLQ for permanent failures
    return error.message?.includes('permanent') || 
           error.message?.includes('validation');
  }
}
