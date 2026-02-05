import { Injectable, Logger } from '@nestjs/common';
import { 
  ConditionOperator, 
  ConditionGroup, 
  SwitchBranch,
  Expression 
} from '../interfaces/workflow.interface';

interface EvaluationContext {
  input: Record<string, any>;
  variables: Record<string, any>;
  output: Record<string, any>;
  state: Record<string, any>;
}

@Injectable()
export class ConditionalBranchService {
  private readonly logger = new Logger(ConditionalBranchService.name);
  private readonly CONDITION_EVALUATION_TIMEOUT = 10000; // 10ms target

  constructor() {}

  /**
   * Evaluate a condition group and return the result
   */
  async evaluateCondition(
    conditions: ConditionGroup[],
    context: EvaluationContext,
  ): Promise<boolean> {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    let result = true;

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const fieldValue = this.resolveFieldValue(condition.field, context);
      const conditionResult = this.evaluateOperator(
        fieldValue,
        condition.operator,
        condition.value,
        context,
      );

      if (i === 0) {
        result = conditionResult;
      } else {
        if (condition.logicalOperator === 'OR') {
          result = result || conditionResult;
        } else {
          result = result && conditionResult;
        }
      }
    }

    return result;
  }

  /**
   * Evaluate a switch/case expression and return the matching branch
   */
  async evaluateSwitch(
    switchValue: any,
    branches: SwitchBranch[],
    defaultBranch?: string,
  ): Promise<string> {
    // First, check for exact matches
    for (const branch of branches) {
      if (branch.caseValue === switchValue) {
        return branch.branchId;
      }
    }

    // Check for range matches (for number ranges)
    for (const branch of branches) {
      if (Array.isArray(branch.caseValue) && branch.caseValue.length === 2) {
        const [min, max] = branch.caseValue;
        if (switchValue >= min && switchValue <= max) {
          return branch.branchId;
        }
      }
    }

    // Return default branch if no match
    return defaultBranch || 'default';
  }

  /**
   * Evaluate an expression and return the result
   */
  async evaluateExpression(
    expression: Expression,
    context: EvaluationContext,
  ): Promise<any> {
    switch (expression.type) {
      case 'literal':
        return expression.value;

      case 'variable':
        return this.resolveFieldValue(expression.path || '', context);

      case 'function':
        return this.executeFunction(expression.value, context);

      case 'operator':
        return this.evaluateOperator(
          expression.value.left,
          expression.value.operator,
          expression.value.right,
          context,
        );

      default:
        return expression.value;
    }
  }

  /**
   * Validate conditions for a node
   */
  async validateConditions(
    conditions: ConditionGroup[],
    schema: Record<string, any>,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const condition of conditions) {
      // Validate field exists in schema
      if (!this.fieldExistsInSchema(condition.field, schema)) {
        errors.push(`Field '${condition.field}' not found in schema`);
        continue;
      }

      // Validate operator is valid
      if (!this.isValidOperator(condition.operator)) {
        errors.push(`Invalid operator '${condition.operator}'`);
        continue;
      }

      // Validate value type matches field type
      const fieldType = this.getFieldType(condition.field, schema);
      if (!this.validateValueType(condition.value, fieldType)) {
        errors.push(
          `Value type mismatch for field '${condition.field}': expected ${fieldType}`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parse a condition string into a ConditionGroup
   */
  parseConditionString(conditionString: string): ConditionGroup {
    // Simple parser for conditions like "field == value" or "field > 10"
    const operators = [
      '==', '!=', '>=', '<=', '<', '>',
      'contains', 'not_contains', 'starts_with', 'ends_with',
      'in', 'not_in', 'is_null', 'is_not_null',
    ];

    for (const operator of operators) {
      const regex = new RegExp(`\\s*(\\w+)\\s*${operator.replace('_', '\\s')}\\s*(.+)`);
      const match = conditionString.match(regex);

      if (match) {
        return {
          field: match[1],
          operator: operator as ConditionOperator,
          value: this.parseValue(match[2]),
        };
      }
    }

    // Default fallback
    return {
      field: 'true',
      operator: ConditionOperator.EQUALS,
      value: true,
    };
  }

  // ============ PRIVATE METHODS ============

  private resolveFieldValue(field: string, context: EvaluationContext): any {
    // Handle prefixed paths
    if (field.startsWith('inputs.')) {
      return this.getValueByPath(context.input, field.replace('inputs.', ''));
    }
    if (field.startsWith('variables.')) {
      return this.getValueByPath(context.variables, field.replace('variables.', ''));
    }
    if (field.startsWith('output.')) {
      return this.getValueByPath(context.output, field.replace('output.', ''));
    }
    if (field.startsWith('state.')) {
      return this.getValueByPath(context.state, field.replace('state.', ''));
    }

    // Try input first, then variables
    const inputValue = this.getValueByPath(context.input, field);
    if (inputValue !== undefined) {
      return inputValue;
    }

    return this.getValueByPath(context.variables, field);
  }

  private evaluateOperator(
    left: any,
    operator: string,
    right: any,
    context: EvaluationContext,
  ): boolean {
    // Resolve right side if it's a field reference
    const resolvedRight = typeof right === 'string' 
      ? this.resolveFieldValue(right, context)
      : right;

    switch (operator) {
      case ConditionOperator.EQUALS:
        return left === resolvedRight;

      case ConditionOperator.NOT_EQUALS:
        return left !== resolvedRight;

      case ConditionOperator.GREATER_THAN:
        return left > resolvedRight;

      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return left >= resolvedRight;

      case ConditionOperator.LESS_THAN:
        return left < resolvedRight;

      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return left <= resolvedRight;

      case ConditionOperator.CONTAINS:
        return String(left).includes(String(resolvedRight));

      case ConditionOperator.NOT_CONTAINS:
        return !String(left).includes(String(resolvedRight));

      case ConditionOperator.STARTS_WITH:
        return String(left).startsWith(String(resolvedRight));

      case ConditionOperator.ENDS_WITH:
        return String(left).endsWith(String(resolvedRight));

      case ConditionOperator.IN:
        return Array.isArray(resolvedRight) && resolvedRight.includes(left);

      case ConditionOperator.NOT_IN:
        return Array.isArray(resolvedRight) && !resolvedRight.includes(left);

      case ConditionOperator.IS_NULL:
        return left === null || left === undefined;

      case ConditionOperator.IS_NOT_NULL:
        return left !== null && left !== undefined;

      case ConditionOperator.IS_EMPTY:
        return (
          left === null ||
          left === undefined ||
          left === '' ||
          (Array.isArray(left) && left.length === 0) ||
          (typeof left === 'object' && Object.keys(left).length === 0)
        );

      case ConditionOperator.IS_NOT_EMPTY:
        return (
          left !== null &&
          left !== undefined &&
          left !== '' &&
          (!Array.isArray(left) || left.length > 0) &&
          (typeof left !== 'object' || (typeof left === 'object' && Object.keys(left).length > 0))
        );

      case ConditionOperator.REGEX:
        try {
          const regex = new RegExp(String(resolvedRight));
          return regex.test(String(left));
        } catch {
          return false;
        }

      case ConditionOperator.BETWEEN:
        if (Array.isArray(resolvedRight) && resolvedRight.length === 2) {
          return left >= resolvedRight[0] && left <= resolvedRight[1];
        }
        return false;

      case ConditionOperator.EXISTS:
        return this.resolveFieldValue(String(resolvedRight), context) !== undefined;

      default:
        this.logger.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  private executeFunction(
    functionCall: { name: string; args: any[] },
    context: EvaluationContext,
  ): any {
    const { name, args } = functionCall;

    // Resolve argument values
    const resolvedArgs = args.map(arg => {
      if (typeof arg === 'object' && arg.type === 'expression') {
        return this.evaluateExpression(arg, context);
      }
      return arg;
    });

    switch (name) {
      case 'length':
        return resolvedArgs[0]?.length || 0;

      case 'uppercase':
        return String(resolvedArgs[0]).toUpperCase();

      case 'lowercase':
        return String(resolvedArgs[0]).toLowerCase();

      case 'trim':
        return String(resolvedArgs[0]).trim();

      case 'split':
        return String(resolvedArgs[0]).split(resolvedArgs[1] || ',');

      case 'join':
        return Array.isArray(resolvedArgs[0])
          ? resolvedArgs[0].join(resolvedArgs[1] || ',')
          : '';

      case 'now':
        return new Date().toISOString();

      case 'formatDate':
        return this.formatDate(resolvedArgs[0], resolvedArgs[1]);

      case 'addDays':
        return this.addDays(resolvedArgs[0], resolvedArgs[1]);

      case 'sum':
        return resolvedArgs.reduce((acc: number, val: number) => acc + (val || 0), 0);

      case 'avg':
        const nums = resolvedArgs.filter((n: number) => typeof n === 'number');
        return nums.length > 0 ? nums.reduce((a: number, b: number) => a + b, 0) / nums.length : 0;

      case 'max':
        return Math.max(...resolvedArgs.filter((n: number) => typeof n === 'number'));

      case 'min':
        return Math.min(...resolvedArgs.filter((n: number) => typeof n === 'number'));

      case 'round':
        return Math.round(resolvedArgs[0] * 100) / 100;

      case 'ceil':
        return Math.ceil(resolvedArgs[0]);

      case 'floor':
        return Math.floor(resolvedArgs[0]);

      default:
        this.logger.warn(`Unknown function: ${name}`);
        return null;
    }
  }

  private fieldExistsInSchema(field: string, schema: Record<string, any>): boolean {
    const parts = field.split('.');
    let current: any = schema;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return false;
      }

      if (Array.isArray(current)) {
        // Check if any item in array has the field
        return current.some((item: any) =>
          item && typeof item === 'object' && part in item,
        );
      }

      current = current[part];
    }

    return current !== undefined;
  }

  private getFieldType(field: string, schema: Record<string, any>): string {
    const parts = field.split('.');
    let current: any = schema;

    for (const part of parts) {
      if (current === undefined) {
        return 'unknown';
      }

      if (Array.isArray(current)) {
        current = current[0];
        continue;
      }

      current = current[part];
    }

    if (current === null || current === undefined) {
      return 'unknown';
    }

    if (Array.isArray(current)) return 'array';
    if (typeof current === 'object') return 'object';
    return typeof current;
  }

  private validateValueType(value: any, expectedType: string): boolean {
    if (value === null || value === undefined) {
      return expectedType === 'null' || expectedType === 'optional';
    }

    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (expectedType === 'any') return true;
    if (expectedType === 'null') return value === null;

    return actualType === expectedType;
  }

  private isValidOperator(operator: string): boolean {
    const validOperators = Object.values(ConditionOperator);
    return validOperators.includes(operator as ConditionOperator);
  }

  private parseValue(valueString: string): any {
    const trimmed = valueString.trim();

    // String literals
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    // Boolean
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    // Null
    if (trimmed === 'null') return null;

    // Number
    const num = Number(trimmed);
    if (!isNaN(num)) return num;

    // Array
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }

    // Object
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }

    // Default: return as string
    return trimmed;
  }

  private getValueByPath(obj: any, path: string): any {
    if (!path) return obj;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private formatDate(date: any, format: string): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);

    return format
      .replace('YYYY', String(d.getFullYear()))
      .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(d.getDate()).padStart(2, '0'))
      .replace('HH', String(d.getHours()).padStart(2, '0'))
      .replace('mm', String(d.getMinutes()).padStart(2, '0'))
      .replace('ss', String(d.getSeconds()).padStart(2, '0'));
  }

  private addDays(date: any, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
}
