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

export enum OpportunityType {
  COMPANY_EVENT = 'company_event',
  INDUSTRY_CONFERENCE = 'industry_conference',
  MEETUP = 'meetup',
  ONLINE_COMMUNITY = 'online_community',
  ALUMNI_NETWORK = 'alumni_network',
  REFERRAL_OPPORTUNITY = 'referral_opportunity',
  JOB_ALERT = 'job_alert',
  RECRUITER_REACHING = 'recruiter_reaching',
  EMPLOYEE_REFERRAL = 'employee_referral',
  SHARED_CONNECTION = 'shared_connection',
}

export enum OpportunityStatus {
  IDENTIFIED = 'identified',
  EVALUATING = 'evaluating',
  PURSUING = 'pursuing',
  ENGAGED = 'engaged',
  CONVERTED = 'converted',
  PASSED = 'passed',
  EXPIRED = 'expired',
}

@Entity('networking_opportunity')
export class NetworkingOpportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: OpportunityType, default: OpportunityType.SHARED_CONNECTION })
  type: OpportunityType;

  @Column({ type: 'enum', enum: OpportunityStatus, default: OpportunityStatus.IDENTIFIED })
  status: OpportunityStatus;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  contactName: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactLinkedIn: string;

  @Column({ nullable: true })
  eventName: string;

  @Column({ nullable: true })
  eventDate: Date;

  @Column({ nullable: true })
  eventUrl: string;

  @Column({ nullable: true })
  source: string;

  @Column({ type: 'jsonb', nullable: true })
  relevanceScore: {
    overall: number;
    companyFit: number;
    roleFit: number;
    locationFit: number;
    cultureFit: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  suggestedActions: {
    action: string;
    priority: string;
    deadline: Date;
    notes: string;
  }[];

  @Column({ nullable: true })
  assignedTemplateId: string;

  @Column({ nullable: true })
  outreachCampaignId: string;

  @Column({ type: 'int', default: 0 })
  outreachAttempts: number;

  @Column({ nullable: true })
  lastOutreachAt: Date;

  @Column({ nullable: true })
  conversionDate: Date;

  @Column({ nullable: true })
  outcome: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

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
