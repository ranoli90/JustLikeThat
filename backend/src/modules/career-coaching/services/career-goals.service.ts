import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareerGoal } from '../entities/career-coaching.entity';

export interface GoalInput {
  userId: string;
  title: string;
  targetDate: Date;
  milestones?: {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    dueDate?: Date;
  }[];
  status?: 'active' | 'achieved' | 'abandoned';
}

@Injectable()
export class CareerGoalsService {
  private readonly logger = new Logger(CareerGoalsService.name);

  constructor(
    @InjectRepository(CareerGoal)
    private readonly goalsRepository: Repository<CareerGoal>,
  ) {}

  async createGoal(input: GoalInput): Promise<CareerGoal> {
    this.logger.log(`Creating career goal for user ${input.userId}`);

    // Generate default milestones if not provided
    const milestones = input.milestones || this.generateDefaultMilestones(input);

    const goal = this.goalsRepository.create({
      userId: input.userId,
      title: input.title,
      targetDate: input.targetDate,
      milestones,
      progress: 0,
      status: 'active',
    });

    const saved = await this.goalsRepository.save(goal);
    return saved;
  }

  async getGoals(userId: string): Promise<CareerGoal[]> {
    return this.goalsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateGoal(goalId: string, updates: Partial<GoalInput>): Promise<CareerGoal> {
    const goal = await this.goalsRepository.findOne({ where: { id: goalId } });
    if (!goal) throw new Error('Goal not found');

    // Update progress based on milestones
    if (updates.milestones) {
      const allMilestones = updates.milestones;
      const completedCount = allMilestones.filter((m: any) => m.completed).length;
      goal.progress = (completedCount / allMilestones.length) * 100;

      // Check if goal is achieved
      if (goal.progress >= 100) {
        goal.status = 'achieved';
      }
    }

    Object.assign(goal, updates);
    await this.goalsRepository.save(goal);

    return goal;
  }

  async updateMilestone(goalId: string, milestoneId: string, completed: boolean): Promise<CareerGoal> {
    const goal = await this.goalsRepository.findOne({ where: { id: goalId } });
    if (!goal) throw new Error('Goal not found');

    const milestones = (goal.milestones as any[]) || [];
    const milestoneIndex = milestones.findIndex((m: any) => m.id === milestoneId);

    if (milestoneIndex !== -1) {
      milestones[milestoneIndex].completed = completed;
      milestones[milestoneIndex].completedAt = completed ? new Date().toISOString() : null;

      // Recalculate progress
      const completedCount = milestones.filter((m: any) => m.completed).length;
      goal.progress = (completedCount / milestones.length) * 100;

      // Check if goal is achieved
      if (goal.progress >= 100) {
        goal.status = 'achieved';
      }
    }

    await this.goalsRepository.save(goal);
    return goal;
  }

  async deleteGoal(goalId: string): Promise<void> {
    await this.goalsRepository.delete(goalId);
  }

  async getGoalProgress(userId: string): Promise<any> {
    const goals = await this.goalsRepository.find({ where: { userId } });

    const activeGoals = goals.filter(g => g.status === 'active');
    const achievedGoals = goals.filter(g => g.status === 'achieved');
    const abandonedGoals = goals.filter(g => g.status === 'abandoned');

    const totalProgress = activeGoals.reduce((sum, g) => sum + (g.progress || 0), 0);
    const avgProgress = activeGoals.length > 0 ? totalProgress / activeGoals.length : 0;

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      achievedGoals: achievedGoals.length,
      abandonedGoals: abandonedGoals.length,
      averageProgress: Math.round(avgProgress * 10) / 10,
      achievementRate: goals.length > 0 
        ? Math.round((achievedGoals.length / goals.length) * 100) 
        : 0,
      upcomingDeadlines: activeGoals
        .filter(g => {
          const daysUntil = (new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          return daysUntil > 0 && daysUntil <= 30;
        })
        .map(g => ({
          id: g.id,
          title: g.title,
          targetDate: g.targetDate,
          progress: g.progress,
          daysRemaining: Math.round((new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        })),
    };
  }

  private generateDefaultMilestones(input: GoalInput): any[] {
    const totalDays = (new Date(input.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    const milestoneCount = Math.min(5, Math.ceil(totalDays / 30));
    const daysPerMilestone = totalDays / milestoneCount;

    const milestones: any[] = [];
    for (let i = 1; i <= milestoneCount; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (daysPerMilestone * i));

      milestones.push({
        id: `m${i}`,
        title: `Milestone ${i}: ${this.getMilestoneTitle(i, milestoneCount)}`,
        description: this.getMilestoneDescription(i, milestoneCount, input.title),
        completed: false,
        dueDate: dueDate.toISOString(),
      });
    }

    return milestones;
  }

  private getMilestoneTitle(index: number, total: number): string {
    const titles = [
      'Planning & Research',
      'Foundation Building',
      'Skill Development',
      'Implementation',
      'Optimization & Achievement',
    ];

    if (index <= titles.length) {
      return titles[index - 1];
    }

    return `Phase ${index}`;
  }

  private getMilestoneDescription(index: number, total: number, goalTitle: string): string {
    const descriptions = [
      `Research and plan your approach to ${goalTitle}`,
      `Build the foundational skills and knowledge needed`,
      `Develop and refine your capabilities`,
      `Execute your plan and track progress`,
      `Achieve your goal and celebrate success`,
    ];

    if (index <= descriptions.length) {
      return descriptions[index - 1];
    }

    return `Complete phase ${index} of your ${goalTitle} journey`;
  }
}
