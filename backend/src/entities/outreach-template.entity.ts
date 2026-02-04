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

export enum TemplateCategory {
  JOB_INQUIRY = 'job_inquiry',
  NETWORKING = 'networking',
  RECRUITER_OUTREACH = 'recruiter_outreach',
  REFERRAL_REQUEST = 'referral_request',
  WARM_INTRO = 'warm_intro',
  FOLLOW_UP = 'follow_up',
  THANK_YOU = 'thank_you',
  INSIDER_CONNECTION = 'insider_connection',
}

@Entity('outreach_template')
export class OutreachTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TemplateCategory, default: TemplateCategory.JOB_INQUIRY })
  category: TemplateCategory;

  @Column({ nullable: true })
  subjectLine: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ nullable: true })
  linkedInMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  personalizationFields: {
    field: string;
    placeholder: string;
    source: string;
    required: boolean;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  variables: {
    name: string;
    value: string;
    source: string;
  }[];

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: false })
  isAiGenerated: boolean;

  @Column({ nullable: true })
  aiPrompt: string;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @Column({ type: 'jsonb', nullable: true })
  performanceMetrics: {
    avgResponseTime: number;
    responseRate: number;
    connectionRate: number;
    meetingRate: number;
  };

  @Column({ nullable: true })
  tags: string[];

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
