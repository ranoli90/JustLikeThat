import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum IntroStatus {
  PENDING = 'pending',
  REQUESTED = 'requested',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum IntroRequestType {
  JOB_REFERRAL = 'job_referral',
  INFORMATIONAL_INTERVIEW = 'informational_interview',
  CAREER_ADVICE = 'career_advice',
  COMPANY_INSIGHT = 'company_insight',
  MENTORSHIP = 'mentorship',
  GENERAL = 'general',
}

@Entity('warm_intro_request')
export class WarmIntroRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  targetName: string;

  @Column({ nullable: true })
  targetEmail: string;

  @Column({ nullable: true })
  targetCompany: string;

  @Column({ nullable: true })
  targetJobTitle: string;

  @Column({ nullable: true })
  mutualConnectionName: string;

  @Column({ nullable: true })
  mutualConnectionEmail: string;

  @Column({ nullable: true })
  mutualConnectionLinkedIn: string;

  @Column({ type: 'enum', enum: IntroRequestType, default: IntroRequestType.GENERAL })
  requestType: IntroRequestType;

  @Column({ type: 'enum', enum: IntroStatus, default: IntroStatus.PENDING })
  status: IntroStatus;

  @Column({ type: 'text' })
  reasonForIntro: string;

  @Column({ type: 'text', nullable: true })
  proposedValue: string;

  @Column({ nullable: true })
  introMessage: string;

  @Column({ nullable: true })
  introMessageId: string;

  @Column({ nullable: true })
  requestedAt: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  respondedAt: Date;

  @Column({ nullable: true })
  responseSummary: string;

  @Column({ type: 'jsonb', nullable: true })
  followUpActions: {
    date: Date;
    action: string;
    notes: string;
  }[];

  @Column({ nullable: true })
  notes: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
