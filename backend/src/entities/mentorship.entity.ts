import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MentorshipStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
}

export enum MentorshipType {
  FORMAL = 'formal',
  INFORMAL = 'informal',
  PEER = 'peer',
  REVERSE = 'reverse',
  INDUSTRY = 'industry',
}

export enum MentorMatchStatus {
  SUGGESTED = 'suggested',
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

@Entity('mentorship_relationships')
export class MentorshipRelationship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid', { nullable: true })
  mentorId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mentorName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mentorTitle: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mentorCompany: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  mentorBio: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mentorEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mentorImageUrl: string;

  @Column({ type: 'enum', enum: MentorshipType })
  type: MentorshipType;

  @Column({ type: 'enum', enum: MentorshipStatus, default: MentorshipStatus.PENDING })
  status: MentorshipStatus;

  @Column({ type: 'enum', enum: MentorMatchStatus, default: MentorMatchStatus.SUGGESTED })
  matchStatus: MentorMatchStatus;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'int', default: 0 })
  meetingsCompleted: number;

  @Column({ type: 'int', nullable: true })
  plannedMeetings: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  meetingFrequency: string;

  @Column({ type: 'jsonb', nullable: true })
  focusAreas: string[];

  @Column({ type: 'jsonb', nullable: true })
  goals: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  meetings: MentorshipMeeting[];

  @Column({ type: 'jsonb', nullable: true })
  feedback: MentorshipFeedback[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface MentorshipMeeting {
  id: string;
  date: Date;
  duration: number;
  topic: string;
  notes: string;
  actionItems: string[];
  followUpItems: string[];
}

export interface MentorshipFeedback {
  id: string;
  date: Date;
  rating: number;
  feedback: string;
  fromUser: boolean;
}

@Entity('mentor_profiles')
export class MentorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  yearsExperience: number;

  @Column({ type: 'jsonb', nullable: true })
  expertiseAreas: string[];

  @Column({ type: 'jsonb', nullable: true })
  industries: string[];

  @Column({ type: 'jsonb', nullable: true })
  careerLevels: string[];

  @Column({ type: 'jsonb', nullable: true })
  skills: string[];

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  mentoringStyle: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  availability: string;

  @Column({ type: 'jsonb', nullable: true })
  linkedIn: string;

  @Column({ type: 'int', default: 0 })
  menteesHelped: number;

  @Column({ type: 'int', default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
