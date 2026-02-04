import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum CampaignType {
  JOB_OUTREACH = 'job_outreach',
  NETWORKING = 'networking',
  RECRUITER = 'recruiter',
  COMPANY_INSIDER = 'company_insider',
  WARM_INTRO = 'warm_intro',
  FOLLOW_UP = 'follow_up',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum TargetType {
  HIRING_MANAGER = 'hiring_manager',
  RECRUITER = 'recruiter',
  EMPLOYEE = 'employee',
  NETWORK_CONTACT = 'network_contact',
  INSIDER = 'insider',
}

@Entity('outreach_campaign')
export class OutreachCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: CampaignType, default: CampaignType.JOB_OUTREACH })
  type: CampaignType;

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column({ type: 'enum', enum: TargetType, default: TargetType.RECRUITER })
  targetType: TargetType;

  @Column({ nullable: true })
  targetCompany: string;

  @Column({ nullable: true })
  targetJobId: string;

  @Column({ nullable: true })
  templateId: string;

  @Column({ type: 'int', default: 0 })
  targetCount: number;

  @Column({ type: 'int', default: 0 })
  sentCount: number;

  @Column({ type: 'int', default: 0 })
  responseCount: number;

  @Column({ type: 'int', default: 0 })
  connectionCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  responseRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @Column({ type: 'jsonb', nullable: true })
  config: {
    autoFollowUp: boolean;
    followUpDelay: number;
    maxFollowUps: number;
    personalizationFields: string[];
    linkedInEnabled: boolean;
    emailEnabled: boolean;
  };

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany('OutreachContact', (contact: any) => contact.campaign)
  contacts: any[];

  @OneToMany('OutreachSequence', (sequence: any) => sequence.campaign)
  sequences: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
