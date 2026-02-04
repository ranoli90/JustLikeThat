import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum FollowUpType {
  THANK_YOU = 'THANK_YOU',
  SECONDARY_FOLLOW_UP = 'SECONDARY_FOLLOW_UP',
  DECISION_REQUEST = 'DECISION_REQUEST',
  OFFER_NEGOTIATION = 'OFFER_NEGOTIATION',
  WITHDRAWAL = 'WITHDRAWAL',
}

export enum ActionStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

@Entity('post_interview_actions')
export class PostInterviewAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  applicationId: string;

  @Column({ type: 'timestamp' })
  interviewDate: Date;

  @Column({ type: 'enum', enum: FollowUpType })
  followUpType: FollowUpType;

  @Column({ type: 'enum', enum: ActionStatus, default: ActionStatus.PENDING })
  status: ActionStatus;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
