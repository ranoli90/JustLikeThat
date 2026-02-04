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

export enum InsiderRelationship {
  CURRENT_EMPLOYEE = 'current_employee',
  FORMER_EMPLOYEE = 'former_employee',
  FRIEND = 'friend',
  FAMILY = 'family',
  ALUMNI = 'alumni',
  RANDOM_CONNECTION = 'random_connection',
}

export enum InsiderStatus {
  IDENTIFIED = 'identified',
  REACHED_OUT = 'reached_out',
  CONNECTED = 'connected',
  INFORMATION_SHARED = 'information_shared',
  REFERRAL_REQUESTED = 'referral_requested',
  REFERRAL_PROVIDED = 'referral_provided',
  NOT_INTERESTED = 'not_interested',
}

@Entity('company_insider')
export class CompanyInsider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company: string;

  @Column({ nullable: true })
  insiderName: string;

  @Column({ nullable: true })
  insiderEmail: string;

  @Column({ nullable: true })
  insiderLinkedIn: string;

  @Column({ type: 'enum', enum: InsiderRelationship, default: InsiderRelationship.RANDOM_CONNECTION })
  relationship: InsiderRelationship;

  @Column({ type: 'enum', enum: InsiderStatus, default: InsiderStatus.IDENTIFIED })
  status: InsiderStatus;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ nullable: true })
  tenure: string;

  @Column({ type: 'jsonb', nullable: true })
  companyInfo: {
    culture: string;
    workLifeBalance: string;
    managementStyle: string;
    growthOpportunities: string;
    compensation: string;
    interviewProcess: string;
    tips: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  referralInfo: {
    referralStatus: string;
    referredBy: string;
    referredTo: string;
    referralBonus: number;
  };

  @Column({ type: 'int', default: 0 })
  outreachCount: number;

  @Column({ nullable: true })
  lastContactedAt: Date;

  @Column({ nullable: true })
  connectionDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  interactionHistory: {
    date: Date;
    type: string;
    summary: string;
    outcome: string;
  }[];

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
