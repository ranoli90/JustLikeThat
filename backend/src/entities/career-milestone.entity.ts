import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MilestoneType {
  ACHIEVEMENT = 'achievement',
  CERTIFICATION = 'certification',
  PROMOTION = 'promotion',
  PROJECT_COMPLETION = 'project_completion',
  SKILL_MASTERY = 'skill_mastery',
  NETWORKING = 'networking',
  LEARNING = 'learning',
  CAREER_TRANSITION = 'career_transition',
}

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

@Entity('career_milestones')
export class CareerMilestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: MilestoneType })
  type: MilestoneType;

  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.PENDING })
  status: MilestoneStatus;

  @Column({ type: 'date', nullable: true })
  targetDate: Date;

  @Column({ type: 'date', nullable: true })
  completedDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  relatedSkill: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  relatedCertification: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  careerPathId: string;

  @Column({ type: 'jsonb', nullable: true })
  requiredCriteria: string[];

  @Column({ type: 'jsonb', nullable: true })
  achievedCriteria: string[];

  @Column({ type: 'int', nullable: true })
  progressPercentage: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('milestone_templates')
export class MilestoneTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: MilestoneType })
  type: MilestoneType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  careerLevel: string;

  @Column({ type: 'jsonb', nullable: true })
  defaultCriteria: string[];

  @Column({ type: 'int', default: 1 })
  order: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
