import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SalaryTimeframe {
  CURRENT = 'current',
  ONE_YEAR = '1_year',
  THREE_YEARS = '3_years',
  FIVE_YEARS = '5_years',
  TEN_YEARS = '10_years',
}

@Entity('salary_projections')
export class SalaryProjection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  role: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'enum', enum: SalaryTimeframe })
  timeframe: SalaryTimeframe;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  minSalary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  medianSalary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  maxSalary: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  currency: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  growthRate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  projectedSalary: number;

  @Column({ type: 'jsonb', nullable: true })
  salaryBreakdown: SalaryBreakdown;

  @Column({ type: 'jsonb', nullable: true })
  comparableRoles: ComparableRole[];

  @Column({ type: 'jsonb', nullable: true })
  factors: SalaryFactor[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface SalaryBreakdown {
  baseSalary: number;
  bonus: number;
  stockOptions: number;
  benefits: number;
  otherCompensation: number;
}

export interface ComparableRole {
  role: string;
  medianSalary: number;
  growthRate: number;
}

export interface SalaryFactor {
  name: string;
  impact: number;
  description: string;
}

@Entity('salary_history')
export class SalaryHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  role: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  salary: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  currency: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  employmentType: string;

  @Column({ type: 'jsonb', nullable: true })
  breakdown: SalaryBreakdown;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
