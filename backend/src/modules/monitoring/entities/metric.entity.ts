import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MetricGroup {
  USER_ACTIVITY = 'user_activity',
  APPLICATION_PERFORMANCE = 'application_performance',
  JOB_INGESTION = 'job_ingestion',
  MATCHING_QUALITY = 'matching_quality',
  COST_TRACKING = 'cost_tracking',
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  TIMER = 'timer',
  HISTOGRAM = 'histogram',
}

@Entity('metrics')
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MetricGroup })
  group: MetricGroup;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: MetricType })
  type: MetricType;

  @Column({ type: 'float' })
  value: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
