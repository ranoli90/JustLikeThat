import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum FeedbackType {
  NPS = 'NPS',
  CSAT = 'CSAT',
  OPEN_ENDED = 'OPEN_ENDED',
}

export enum FeedbackTrigger {
  APPLICATION_COMPLETED = 'APPLICATION_COMPLETED',
  INTERVIEW_COMPLETED = 'INTERVIEW_COMPLETED',
  REJECTION = 'REJECTION',
  ONBOARDING = 'ONBOARDING',
  GENERAL = 'GENERAL',
}

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.feedbacks)
  user: User;

  @Column({ type: 'enum', enum: FeedbackType })
  type: FeedbackType;

  @Column({ type: 'enum', enum: FeedbackTrigger })
  trigger: FeedbackTrigger;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
