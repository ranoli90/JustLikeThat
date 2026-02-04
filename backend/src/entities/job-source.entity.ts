import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum JobSourceCategory {
  API_INTEGRATION = 'API_INTEGRATION',
  EMAIL_APP = 'EMAIL_APP',
  USER_AUTOFILL = 'USER_AUTOFILL',
}

export enum ComplianceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum SourceReliability {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum CostEffectiveness {
  VERY_HIGH = 'VERY_HIGH',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  VERY_LOW = 'VERY_LOW',
}

@Entity('job_sources')
export class JobSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: JobSourceCategory })
  category: JobSourceCategory;

  @Column({ type: 'enum', enum: ComplianceLevel, default: ComplianceLevel.MEDIUM })
  complianceLevel: ComplianceLevel;

  @Column({ type: 'enum', enum: SourceReliability, default: SourceReliability.MEDIUM })
  reliability: SourceReliability;

  @Column({ type: 'enum', enum: CostEffectiveness, default: CostEffectiveness.MEDIUM })
  costEffectiveness: CostEffectiveness;

  @Column({ default: true })
  isAllowed: boolean;

  @Column({ type: 'jsonb', nullable: true })
  config: any;

  @Column({ type: 'text', nullable: true })
  cronSchedule: string;

  @Column({ type: 'integer', default: 60 }) // minutes
  frequency: number;

  @Column({ type: 'integer', default: 3 })
  maxRetries: number;

  @Column({ type: 'integer', default: 60 }) // seconds
  retryDelay: number;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
