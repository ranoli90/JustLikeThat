import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum ABTestStatus {
  DRAFT = 'DRAFT',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class ABTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ABTestStatus, default: ABTestStatus.DRAFT })
  status: ABTestStatus;

  @Column({ type: 'jsonb' })
  variants: { id: string; name: string; weight: number; config: any }[];

  @Column({ type: 'jsonb', nullable: true })
  targetAudience: { segments?: string[]; userIds?: string[] };

  @Column({ type: 'int', default: 100 })
  trafficPercentage: number;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  results: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity()
export class ABTestAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.abTestAssignments)
  user: User;

  @Column()
  testId: string;

  @Column()
  variantId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;
}
