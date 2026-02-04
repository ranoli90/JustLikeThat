import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OutreachCampaign } from './outreach-campaign.entity';
import { User } from './user.entity';

export enum SequenceType {
  INITIAL = 'initial',
  FOLLOW_UP_1 = 'follow_up_1',
  FOLLOW_UP_2 = 'follow_up_2',
  FOLLOW_UP_3 = 'follow_up_3',
  ICE_BREAKER = 'ice_breaker',
  FINAL = 'final',
}

export enum SequenceStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

@Entity('outreach_sequence')
export class OutreachSequence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: SequenceType, default: SequenceType.INITIAL })
  type: SequenceType;

  @Column({ type: 'enum', enum: SequenceStatus, default: SequenceStatus.DRAFT })
  status: SequenceStatus;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'int', default: 0 })
  delayDays: number;

  @Column({ nullable: true })
  templateId: string;

  @Column({ nullable: true })
  subjectLine: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  personalizationFields: string[];

  @Column({ default: true })
  includeLinkedIn: boolean;

  @Column({ nullable: true })
  linkedInMessage: string;

  @Column({ default: true })
  includeEmail: boolean;

  @Column({ nullable: true })
  conditions: {
    triggerOnNoResponse: boolean;
    triggerOnNoOpen: boolean;
    triggerOnClick: boolean;
    maxRetries: number;
    skipIfReplied: boolean;
  };

  @Column({ type: 'int', default: 0 })
  sentCount: number;

  @Column({ type: 'int', default: 0 })
  openCount: number;

  @Column({ type: 'int', default: 0 })
  responseCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  openRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  responseRate: number;

  @Column({ nullable: true })
  campaignId: string;

  @ManyToOne(() => OutreachCampaign, (campaign: any) => campaign.sequences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: OutreachCampaign;

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
