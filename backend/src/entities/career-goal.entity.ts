import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum GoalTimeframe {
  SHORT_TERM = 'short_term',
  MEDIUM_TERM = 'medium_term',
  LONG_TERM = 'long_term',
}

export enum GoalStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_TRACK = 'on_track',
  AT_RISK = 'at_risk',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum GoalPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('career_goals')
export class CareerGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: GoalTimeframe })
  timeframe: GoalTimeframe;

  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.DRAFT })
  status: GoalStatus;

  @Column({ type: 'enum', enum: GoalPriority, default: GoalPriority.MEDIUM })
  priority: GoalPriority;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  targetDate: Date;

  @Column({ type: 'date', nullable: true })
  completedDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  objectives: GoalObjective[];

  @Column({ type: 'jsonb', nullable: true })
  keyResults: KeyResult[];

  @Column({ type: 'int', default: 0 })
  progressPercentage: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  relatedCareerPathId: string;

  @Column({ type: 'jsonb', nullable: true })
  relatedSkills: string[];

  @Column({ type: 'jsonb', nullable: true })
  metrics: GoalMetric[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  obstacles: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  strategies: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  supportNeeded: string;

  @Column({ type: 'jsonb', nullable: true })
  milestones: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface GoalObjective {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  completedDate?: Date;
  order: number;
}

export interface KeyResult {
  id: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  isAchieved: boolean;
}

export interface GoalMetric {
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  lastUpdated: Date;
}
