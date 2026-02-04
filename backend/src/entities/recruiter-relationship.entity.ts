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

export enum RecruiterRelationshipStatus {
  NEW = 'new',
  ACTIVE = 'active',
  DORMANT = 'dormant',
  PLACED = 'placed',
  ARCHIVED = 'archived',
}

@Entity('recruiter_relationship')
export class RecruiterRelationship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recruiterName: string;

  @Column({ nullable: true })
  recruiterEmail: string;

  @Column({ nullable: true })
  recruiterPhone: string;

  @Column({ nullable: true })
  recruiterLinkedIn: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  companyWebsite: string;

  @Column({ nullable: true })
  companyIndustry: string;

  @Column({ nullable: true })
  companySize: string;

  @Column({ nullable: true })
  specializations: string[];

  @Column({ type: 'enum', enum: RecruiterRelationshipStatus, default: RecruiterRelationshipStatus.NEW })
  status: RecruiterRelationshipStatus;

  @Column({ type: 'int', default: 0 })
  outreachCount: number;

  @Column({ type: 'int', default: 0 })
  responseCount: number;

  @Column({ type: 'int', default: 0 })
  placementsCount: number;

  @Column({ type: 'int', default: 0 })
  interviewsCount: number;

  @Column({ type: 'int', default: 0 })
  offersCount: number;

  @Column({ nullable: true })
  lastContactedAt: Date;

  @Column({ nullable: true })
  nextFollowUp: Date;

  @Column({ type: 'jsonb', nullable: true })
  interactionHistory: {
    date: Date;
    type: string;
    summary: string;
    outcome: string;
    notes: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    preferredContactMethod: string;
    bestTimeToContact: string;
    responseTime: string;
    jobAlerts: boolean;
  };

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  rating: {
    score: number;
    criteria: string[];
    feedback: string;
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
