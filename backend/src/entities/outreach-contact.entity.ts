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

export enum ContactStatus {
  PENDING = 'pending',
  CONTACTED = 'contacted',
  RESPONDED = 'responded',
  CONNECTED = 'connected',
  MEETING_SCHEDULED = 'meeting_scheduled',
  NEGATIVE = 'negative',
  BOUNCED = 'bounced',
}

export enum ContactType {
  HIRING_MANAGER = 'hiring_manager',
  RECRUITER = 'recruiter',
  HIRING_DIRECTOR = 'hiring_director',
  EMPLOYEE = 'employee',
  NETWORK_CONTACT = 'network_contact',
  INSIDER = 'insider',
}

export enum Channel {
  EMAIL = 'email',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  REFERRAL = 'referral',
  OTHER = 'other',
}

@Entity('outreach_contact')
export class OutreachContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  linkedInUrl: string;

  @Column({ nullable: true })
  linkedInId: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ type: 'enum', enum: ContactType, default: ContactType.RECRUITER })
  type: ContactType;

  @Column({ type: 'enum', enum: ContactStatus, default: ContactStatus.PENDING })
  status: ContactStatus;

  @Column({ type: 'enum', enum: Channel, default: Channel.EMAIL })
  primaryChannel: Channel;

  @Column({ type: 'int', default: 0 })
  outreachAttempts: number;

  @Column({ type: 'int', default: 0 })
  followUpCount: number;

  @Column({ nullable: true })
  lastContactedAt: Date;

  @Column({ nullable: true })
  respondedAt: Date;

  @Column({ nullable: true })
  connectedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  personalization: {
    commonConnections: string[];
    recentPosts: string[];
    companyNews: string[];
    mutualInterests: string[];
    icebreaker: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  engagementHistory: {
    date: Date;
    channel: Channel;
    action: string;
    outcome: string;
    notes: string;
  }[];

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  campaignId: string;

  @ManyToOne(() => OutreachCampaign, (campaign) => campaign.contacts, { onDelete: 'CASCADE' })
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
