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

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  REPLIED = 'replied',
  BOUNCED = 'bounced',
  FAILED = 'failed',
}

export enum MessageType {
  EMAIL = 'email',
  LINKEDIN_MESSAGE = 'linkedin_message',
  LINKEDIN_CONNECTION = 'linkedin_connection',
  FOLLOW_UP = 'follow_up',
  ICE_BREAKER = 'ice_breaker',
}

@Entity('outreach_message')
export class OutreachMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  contactId: string;

  @Column({ nullable: true })
  campaignId: string;

  @Column({ nullable: true })
  sequenceId: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.EMAIL })
  type: MessageType;

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.PENDING })
  status: MessageStatus;

  @Column({ nullable: true })
  subjectLine: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'text', nullable: true })
  renderedBody: string;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  openedAt: Date;

  @Column({ nullable: true })
  clickedAt: Date;

  @Column({ nullable: true })
  repliedAt: Date;

  @Column({ type: 'int', nullable: true })
  openCount: number;

  @Column({ type: 'int', nullable: true })
  clickCount: number;

  @Column({ nullable: true })
  bounceReason: string;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  trackingData: {
    emailId: string;
    campaignId: string;
    templateId: string;
    personalization: Record<string, any>;
  };

  @Column({ nullable: true })
  responseSummary: string;

  @Column({ type: 'jsonb', nullable: true })
  aiInsights: {
    sentiment: string;
    keyTopics: string[];
    suggestedFollowUp: string;
  };

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
