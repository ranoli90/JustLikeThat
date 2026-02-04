import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Application } from './application.entity';
import { CompanyInsight } from './company-insight.entity';
import { InterviewQuestion } from './interview-question.entity';
import { InterviewPractice } from './interview-practice.entity';
import { InterviewSchedule } from './interview-schedule.entity';

export enum InterviewType {
  PHONE_SCREEN = 'PHONE_SCREEN',
  BEHAVIORAL = 'BEHAVIORAL',
  TECHNICAL = 'TECHNICAL',
  CASE_STUDY = 'CASE_STUDY',
  PANEL = 'PANEL',
  FINAL = 'FINAL',
  ONSITE = 'ONSITE',
  VIDEO = 'VIDEO',
  ASSESSMENT = 'ASSESSMENT',
}

export enum InterviewFormat {
  VIRTUAL = 'VIRTUAL',
  ONSITE = 'ONSITE',
  PHONE = 'PHONE',
  ASYNC_VIDEO = 'ASYNC_VIDEO',
}

export enum InterviewStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('interview_sessions')
export class InterviewSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  applicationId: string | null;

  @Column({ type: 'enum', enum: InterviewType })
  interviewType: InterviewType;

  @Column({ type: 'enum', enum: InterviewFormat })
  interviewFormat: InterviewFormat;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'int', default: 60 })
  duration: number;

  @Column({ type: 'enum', enum: InterviewStatus, default: InterviewStatus.DRAFT })
  status: InterviewStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'json', nullable: true })
  feedback: Record<string, unknown> | null;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Application, { nullable: true })
  @JoinColumn({ name: 'applicationId' })
  application: Application | null;

  @OneToOne(() => CompanyInsight, (company) => company.session)
  company: CompanyInsight;

  @OneToMany(() => InterviewQuestion, (question) => question.session)
  questions: InterviewQuestion[];

  @OneToMany(() => InterviewPractice, (practice) => practice.session)
  practices: InterviewPractice[];

  @OneToOne(() => InterviewSchedule, (schedule) => schedule.session)
  schedules: InterviewSchedule;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
