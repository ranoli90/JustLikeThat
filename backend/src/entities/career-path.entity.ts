import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';

export enum PathType {
  VERTICAL = 'vertical', // Promotion path
  LATERAL = 'lateral', // Horizontal move
  DIAGONAL = 'diagonal', // Cross-functional move
  pivot = 'pivot', // Career change
}

export enum CareerLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  MANAGER = 'manager',
  DIRECTOR = 'director',
  VP = 'vp',
  C_LEVEL = 'c_level',
}

@Entity('career_paths')
export class CareerPath {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'enum', enum: PathType })
  pathType: PathType;

  @Column({ type: 'enum', enum: CareerLevel })
  currentLevel: CareerLevel;

  @Column({ type: 'enum', enum: CareerLevel })
  targetLevel: CareerLevel;

  @Column({ type: 'varchar', length: 255, nullable: true })
  currentRole: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  targetRole: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string;

  @Column({ type: 'jsonb', nullable: true })
  requiredSkills: string[];

  @Column({ type: 'jsonb', nullable: true })
  preferredSkills: string[];

  @Column({ type: 'int', nullable: true })
  estimatedTimelineMonths: number;

  @Column({ type: 'int', default: 0 })
  progressPercentage: number;

  @Column({ type: 'jsonb', nullable: true })
  milestones: CareerMilestone[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface CareerMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  isCompleted: boolean;
  order: number;
}
