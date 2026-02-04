import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum SkillCategory {
  TECHNICAL = 'technical',
  SOFT = 'soft',
  LEADERSHIP = 'leadership',
  DOMAIN = 'domain',
  CERTIFICATION = 'certification',
}

@Entity('skill_gaps')
export class SkillGap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  skillName: string;

  @Column({ type: 'enum', enum: SkillCategory })
  category: SkillCategory;

  @Column({ type: 'enum', enum: SkillLevel })
  currentLevel: SkillLevel;

  @Column({ type: 'enum', enum: SkillLevel })
  requiredLevel: SkillLevel;

  @Column({ type: 'int', nullable: true })
  gapScore: number; // 0-100, higher means bigger gap

  @Column({ type: 'varchar', length: 255, nullable: true })
  relatedRole: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  learningResources: LearningResourceReference[];

  @Column({ type: 'jsonb', nullable: true })
  developmentPlan: DevelopmentPlanStep[];

  @Column({ type: 'int', nullable: true })
  estimatedHoursToMaster: number;

  @Column({ type: 'int', default: 0 })
  hoursInvested: number;

  @Column({ type: 'date', nullable: true })
  targetDate: Date;

  @Column({ type: 'boolean', default: true })
  isPriority: boolean;

  @Column({ type: 'int', default: 0 })
  priorityOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface LearningResourceReference {
  resourceId: string;
  title: string;
  type: string;
  url?: string;
  isCompleted: boolean;
}

export interface DevelopmentPlanStep {
  stepNumber: number;
  title: string;
  description: string;
  estimatedHours: number;
  isCompleted: boolean;
  completedDate?: Date;
  resources: string[];
}
