import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { JobPosting } from './job-posting.entity';

export enum ApplicationState {
  DRAFT = 'DRAFT',
  PENDING_TAILORING = 'PENDING_TAILORING',
  TAILORED = 'TAILORED',
  PENDING_APPLICATION = 'PENDING_APPLICATION',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum AutonomyMode {
  MANUAL = 0,
  SEMI_AUTOMATIC = 1,
  FULLY_AUTOMATIC = 2,
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => JobPosting, (jobPosting) => jobPosting.id)
  @JoinColumn({ name: 'jobPostingId' })
  jobPosting: JobPosting;

  @Column()
  jobPostingId: string;

  @Column({ type: 'enum', enum: ApplicationState, default: ApplicationState.DRAFT })
  state: ApplicationState;

  @Column({ type: 'enum', enum: AutonomyMode, default: AutonomyMode.MANUAL })
  autonomyMode: AutonomyMode;

  @Column({ type: 'jsonb', nullable: true })
  tailoredResume?: any;

  @Column({ type: 'jsonb', nullable: true })
  tailoredCoverLetter?: any;

  @Column({ nullable: true })
  submittedAt?: Date;

  @Column({ nullable: true })
  withdrawnAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
