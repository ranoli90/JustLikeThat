import { ConditionalBranchService } from './conditional-branch.service';
import { ConditionOperator } from '../interfaces/workflow.interface';

describe('ConditionalBranchService', () => {
  let service: ConditionalBranchService;

  beforeEach(() => {
    service = new ConditionalBranchService();
  });

  describe('evaluateCondition', () => {
    it('should evaluate simple equals condition', async () => {
      const conditions = [
        { field: 'status', operator: ConditionOperator.EQUALS, value: 'active' },
      ];

      const context = {
        input: { status: 'active' },
        variables: {},
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should evaluate NOT_EQUALS condition', async () => {
      const conditions = [
        { field: 'status', operator: ConditionOperator.NOT_EQUALS, value: 'deleted' },
      ];

      const context = {
        input: { status: 'active' },
        variables: {},
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should evaluate GREATER_THAN condition', async () => {
      const conditions = [
        { field: 'count', operator: ConditionOperator.GREATER_THAN, value: 10 },
      ];

      const context = {
        input: { count: 15 },
        variables: {},
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should evaluate LESS_THAN_OR_EQUAL condition', async () => {
      const conditions = [
        { field: 'value', operator: ConditionOperator.LESS_THAN_OR_EQUAL, value: 100 },
      ];

      const context = {
        input: { value: 100 },
        variables: {},
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should evaluate CONTAINS condition', async () => {
      const conditions = [
        { field: 'email', operator: ConditionOperator.CONTAINS, value: '@example.com' },
      ];

      const context = {
        input: { email: 'test@example.com' },
        variables: {},
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should evaluate IN condition', async () => {
      const conditions = [
        { field: 'status', operator: ConditionOperator.IN, value: ['active', 'pending', 'trial'] },
      ];

      const context = {
        input: { status: 'pending' },
        variables: {},
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should evaluate IS_NULL condition', async () => {
      const conditions = [
        { field: 'optionalField', operator: ConditionOperator.IS_NULL, value: null },
      ];

      const context = {
        input: { optionalField: null },
        variables: {},
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should evaluate IS_NOT_NULL condition', async () => {
      const conditions = [
        { field: 'requiredField', operator: ConditionOperator.IS_NOT_NULL, value: null },
      ];

      const context = {
        input: { requiredField: 'has value' },
        variables: {},
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should evaluate IS_EMPTY condition', async () => {
      const conditions = [
        { field: 'name', operator: ConditionOperator.IS_EMPTY, value: '' },
      ];

      const context = {
        input: { name: '' },
        variables: {},
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should evaluate REGEX condition', async () => {
      const conditions = [
        { field: 'email', operator: ConditionOperator.REGEX, value: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
      ];

      const context = {
        input: { email: 'test@example.com' },
        variables: {},
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should evaluate BETWEEN condition', async () => {
      const conditions = [
        { field: 'age', operator: ConditionOperator.BETWEEN, value: [18, 65] },
      ];

      const context = {
        input: { age: 30 },
        variables: {},
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should handle AND logical operator', async () => {
      const conditions = [
        { field: 'age', operator: ConditionOperator.GREATER_THAN, value: 18 },
        { field: 'status', operator: ConditionOperator.EQUALS, value: 'active', logicalOperator: 'AND' },
      ];

      const context = {
        input: { age: 25, status: 'active' },
        variables: {},
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should handle OR logical operator', async () => {
      const conditions = [
        { field: 'role', operator: ConditionOperator.EQUALS, value: 'admin' },
        { field: 'role', operator: ConditionOperator.EQUALS, value: 'moderator', logicalOperator: 'OR' },
      ];

      const context = {
        input: { role: 'moderator' },
        variables: {},
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should resolve variable references', async () => {
      const conditions = [
        { field: 'variables.threshold', operator: ConditionOperator.LESS_THAN, value: 100 },
      ];

      const context = {
        input: {},
        variables: { threshold: 50 },
        output: {},
        state: {},
      };

      const result = await service.evaluateCondition(conditions, context);
      expect(result).toBe(true);
    });

    it('should handle empty conditions', async () => {
      const result = await service.evaluateCondition([], {
        input: {},
        variables: {},
        output: {},
        state: {},
      });
      expect(result).toBe(true);
    });
  });

  describe('evaluateSwitch', () => {
    it('should return matching branch', async () => {
      const branches = [
        { caseValue: 'small', branchId: 'small_branch' },
        { caseValue: 'medium', branchId: 'medium_branch' },
        { caseValue: 'large', branchId: 'large_branch' },
      ];

      const result = await service.evaluateSwitch('medium', branches);
      expect(result).toBe('medium_branch');
    });

    it('should return default branch when no match', async () => {
      const branches = [
        { caseValue: 'small', branchId: 'small_branch' },
      ];

      const result = await service.evaluateSwitch('large', branches, 'default_branch');
      expect(result).toBe('default_branch');
    });

    it('should handle range matches', async () => {
      const branches = [
        { caseValue: [0, 18], branchId: 'minor' },
        { caseValue: [19, 65], branchId: 'adult' },
        { caseValue: [66, 120], branchId: 'senior' },
      ];

      const result = await service.evaluateSwitch(25, branches);
      expect(result).toBe('adult');
    });
  });

  describe('validateConditions', () => {
    it('should validate valid conditions', async () => {
      const conditions = [
        { field: 'status', operator: ConditionOperator.EQUALS, value: 'active' },
      ];

      const schema = {
        properties: {
          status: { type: 'string' },
        },
      };

      const result = await service.validateConditions(conditions, schema as any);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid fields', async () => {
      const conditions = [
        { field: 'invalidField', operator: ConditionOperator.EQUALS, value: 'test' },
      ];

      const schema = {
        properties: {
          status: { type: 'string' },
        },
      };

      const result = await service.validateConditions(conditions, schema as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return errors for invalid operators', async () => {
      const conditions = [
        { field: 'status', operator: 'invalid_operator', value: 'test' },
      ];

      const schema = {
        properties: {
          status: { type: 'string' },
        },
      };

      const result = await service.validateConditions(conditions, schema as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('parseConditionString', () => {
    it('should parse simple equals condition', () => {
      const result = service.parseConditionString('status == active');
      expect(result.field).toBe('status');
      expect(result.operator).toBe(ConditionOperator.EQUALS);
      expect(result.value).toBe('active');
    });

    it('should parse greater than condition', () => {
      const result = service.parseConditionString('count > 10');
      expect(result.field).toBe('count');
      expect(result.operator).toBe(ConditionOperator.GREATER_THAN);
      expect(result.value).toBe(10);
    });

    it('should parse string values', () => {
      const result = service.parseConditionString("name == 'John'");
      expect(result.field).toBe('name');
      expect(result.operator).toBe(ConditionOperator.EQUALS);
      expect(result.value).toBe('John');
    });

    it('should parse boolean values', () => {
      const result = service.parseConditionString('isActive == true');
      expect(result.field).toBe('isActive');
      expect(result.operator).toBe(ConditionOperator.EQUALS);
      expect(result.value).toBe(true);
    });

    it('should parse null values', () => {
      const result = service.parseConditionString('optional == null');
      expect(result.field).toBe('optional');
      expect(result.operator).toBe(ConditionOperator.EQUALS);
      expect(result.value).toBe(null);
    });
  });
});
