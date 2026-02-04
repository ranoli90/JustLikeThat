import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TrendType {
  SKILL = 'skill',
  ROLE = 'role',
  TECHNOLOGY = 'technology',
  CERTIFICATION = 'certification',
  INDUSTRY = 'industry',
  TOOL = 'tool',
}

export enum TrendDirection {
  RISING = 'rising',
  DECLINING = 'declining',
  STABLE = 'stable',
  EMERGING = 'emerging',
}

@Entity('industry_trends')
export class IndustryTrend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: TrendType })
  type: TrendType;

  @Column({ type: 'enum', enum: TrendDirection })
  direction: TrendDirection;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'jsonb', nullable: true })
  relatedSkills: string[];

  @Column({ type: 'jsonb', nullable: true })
  affectedRoles: string[];

  @Column({ type: 'jsonb', nullable: true })
  affectedIndustries: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  growthRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  demandScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  salaryImpact: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timeframe: string;

  @Column({ type: 'date', nullable: true })
  projectedPeak: Date;

  @Column({ type: 'date', nullable: true })
  projectedDecline: Date;

  @Column({ type: 'jsonb', nullable: true })
  resources: TrendResource[];

  @Column({ type: 'jsonb', nullable: true })
  predictions: TrendPrediction[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface TrendResource {
  title: string;
  url: string;
  type: string;
}

export interface TrendPrediction {
  year: number;
  prediction: string;
  confidence: number;
}

@Entity('skill_predictions')
export class SkillPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  skill: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  currentDemand: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  predictedDemand1Year: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  predictedDemand3Years: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  predictedDemand5Years: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  urgencyScore: number;

  @Column({ type: 'text', nullable: true })
  rationale: string;

  @Column({ type: 'jsonb', nullable: true })
  relatedSkills: string[];

  @Column({ type: 'jsonb', nullable: true })
  learningResources: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
