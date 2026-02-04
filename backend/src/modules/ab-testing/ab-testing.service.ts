import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ABTest, ABTestAssignment, ABTestStatus } from '../../entities/ab-test.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class ABTestingService {
  constructor(
    @InjectRepository(ABTest)
    private readonly abTestRepository: Repository<ABTest>,
    @InjectRepository(ABTestAssignment)
    private readonly assignmentRepository: Repository<ABTestAssignment>,
  ) {}

  async createTest(name: string, description: string, variants: any[]): Promise<ABTest> {
    const test = this.abTestRepository.create({
      name,
      description,
      variants,
      status: ABTestStatus.DRAFT,
    });

    return this.abTestRepository.save(test);
  }

  async startTest(testId: string): Promise<ABTest> {
    const test = await this.abTestRepository.findOne({ where: { id: testId } });
    if (!test) {
      throw new Error('Test not found');
    }

    test.status = ABTestStatus.RUNNING;
    test.startDate = new Date();

    return this.abTestRepository.save(test);
  }

  async pauseTest(testId: string): Promise<ABTest> {
    const test = await this.abTestRepository.findOne({ where: { id: testId } });
    if (!test) {
      throw new Error('Test not found');
    }

    test.status = ABTestStatus.PAUSED;
    return this.abTestRepository.save(test);
  }

  async completeTest(testId: string): Promise<ABTest> {
    const test = await this.abTestRepository.findOne({ where: { id: testId } });
    if (!test) {
      throw new Error('Test not found');
    }

    test.status = ABTestStatus.COMPLETED;
    test.endDate = new Date();
    test.results = await this.calculateTestResults(testId);

    return this.abTestRepository.save(test);
  }

  async getTest(testId: string): Promise<ABTest | null> {
    return this.abTestRepository.findOne({ where: { id: testId } });
  }

  async getAllTests(): Promise<ABTest[]> {
    return this.abTestRepository.find({ order: { createdAt: 'DESC' } });
  }

  async assignVariant(user: User, testName: string): Promise<ABTestAssignment> {
    // Check for existing assignment
    const existingAssignment = await this.assignmentRepository.findOne({
      where: { user: { id: user.id }, testId: testName },
    });

    if (existingAssignment) {
      return existingAssignment;
    }

    // Get active test
    const test = await this.abTestRepository.findOne({
      where: { name: testName, status: ABTestStatus.RUNNING },
    });

    if (!test) {
      throw new Error('Test not found or not running');
    }

    // Check if user is in target audience
    if (test.targetAudience?.userIds && !test.targetAudience.userIds.includes(user.id)) {
      throw new Error('User not in target audience');
    }

    // Check traffic percentage
    const hash = this.hashUserId(user.id, testName);
    const percentile = hash % 100;
    if (percentile >= test.trafficPercentage) {
      // User is not in the test population
      throw new Error('User not in test population');
    }

    // Select variant based on weights
    const variant = this.selectVariant(test.variants);

    const assignment = this.assignmentRepository.create({
      user,
      testId: testName,
      variantId: variant.id,
    });

    return this.assignmentRepository.save(assignment);
  }

  async getUserVariant(user: User, testName: string): Promise<ABTestAssignment | null> {
    return this.assignmentRepository.findOne({
      where: { user: { id: user.id }, testId: testName },
    });
  }

  async recordConversion(assignmentId: string, conversionData: any): Promise<ABTestAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    assignment.metadata = {
      ...assignment.metadata,
      conversions: [...(assignment.metadata?.conversions || []), conversionData],
    };

    return this.assignmentRepository.save(assignment);
  }

  async calculateTestResults(testId: string): Promise<any> {
    const test = await this.abTestRepository.findOne({ where: { id: testId } });
    if (!test) {
      throw new Error('Test not found');
    }

    const assignments = await this.assignmentRepository.find({
      where: { testId: test.name },
    });

    const variantResults = {};

    for (const variant of test.variants) {
      const variantAssignments = assignments.filter((a) => a.variantId === variant.id);
      const conversions = variantAssignments.filter(
        (a) => a.metadata?.conversions?.length > 0,
      ).length;

      variantResults[variant.id] = {
        name: variant.name,
        totalUsers: variantAssignments.length,
        conversions,
        conversionRate: variantAssignments.length > 0
          ? (conversions / variantAssignments.length) * 100
          : 0,
      };
    }

    // Calculate statistical significance
    const results = {
      variants: variantResults,
      totalParticipants: assignments.length,
      calculatedAt: new Date(),
    };

    return results;
  }

  private hashUserId(userId: string, testName: string): number {
    let hash = 0;
    const str = `${userId}:${testName}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private selectVariant(variants: any[]): any {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const random = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (random < cumulativeWeight) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }
}
