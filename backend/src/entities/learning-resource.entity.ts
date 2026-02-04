import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ResourceType {
  COURSE = 'course',
  TUTORIAL = 'tutorial',
  BOOK = 'book',
  VIDEO = 'video',
  ARTICLE = 'article',
  PODCAST = 'podcast',
  BOOTCAMP = 'bootcamp',
  DEGREE = 'degree',
  WORKSHOP = 'workshop',
  CERTIFICATION_PREP = 'certification_prep',
}

export enum ResourceStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  ARCHIVED = 'archived',
}

@Entity('learning_resources')
export class LearningResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'enum', enum: ResourceType })
  type: ResourceType;

  @Column({ type: 'enum', enum: ResourceStatus, default: ResourceStatus.NOT_STARTED })
  status: ResourceStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  provider: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  estimatedHours: number;

  @Column({ type: 'int', default: 0 })
  hoursCompleted: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  difficulty: string;

  @Column({ type: 'jsonb', nullable: true })
  skills: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  currency: string;

  @Column({ type: 'boolean', default: false })
  isFree: boolean;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  targetDate: Date;

  @Column({ type: 'date', nullable: true })
  completedDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  rating: string;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'jsonb', nullable: true })
  relatedSkillGaps: string[];

  @Column({ type: 'jsonb', nullable: true })
  modules: ResourceModule[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface ResourceModule {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedHours: number;
  isCompleted: boolean;
  completedDate?: Date;
}

@Entity('learning_resource_templates')
export class LearningResourceTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'enum', enum: ResourceType })
  type: ResourceType;

  @Column({ type: 'varchar', length: 255 })
  provider: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  estimatedHours: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  difficulty: string;

  @Column({ type: 'jsonb', nullable: true })
  skills: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  currency: string;

  @Column({ type: 'boolean', default: false })
  isFree: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  rating: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
