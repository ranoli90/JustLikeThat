// Innovation Sandbox Entities - Sprint 48
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('innovation_experiments')
@Index(['status'])
export class InnovationExperiment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  hypothesis: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string; // draft, running, paused, completed, cancelled

  @Column({ type: 'varchar', length: 100 })
  featureFlagKey: string;

  @Column({ type: 'json', nullable: true })
  metrics: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'json', nullable: true })
  results: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Feature Flag Entity
@Entity('feature_flags')
@Index(['isEnabled'])
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'boolean', default: false })
  isEnabled: boolean;

  @Column({ type: 'int', default: 0 })
  rolloutPercentage: number;

  @Column({ type: 'json', nullable: true })
  targeting: Record<string, any>; // User targeting rules

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Experiment Participant Entity
@Entity('experiment_participants')
@Unique(['experimentId', 'userId'])
@Index(['experimentId'])
export class ExperimentParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  experimentId: string;

  @Column({ type: 'varchar', length: 100 })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  variant: string; // control, treatment_a, treatment_b

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;
}

// User Feedback Entity
@Entity('user_feedback')
@Index(['experimentId'])
@Index(['featureFlagKey'])
export class UserFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  experimentId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  featureFlagKey: string;

  @Column({ type: 'varchar', length: 100 })
  userId: string;

  @Column({ type: 'text' })
  feedback: string;

  @Column({ type: 'int', nullable: true })
  rating: number; // 1-5 rating

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
