import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InterviewSession } from './interview-session.entity';

@Entity('interview_practices')
export class InterviewPractice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'uuid', nullable: true })
  questionId: string | null;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  userAnswer: string;

  @Column({ type: 'json', nullable: true })
  aiFeedback: Record<string, unknown> | null;

  @Column({ type: 'float', nullable: true })
  confidenceScore: number | null;

  @Column({ type: 'int', nullable: true })
  timeTaken: number | null;

  @Column({ type: 'json', nullable: true })
  improvementAreas: string[] | null;

  @Column({ type: 'json', nullable: true })
  strengths: string[] | null;

  @ManyToOne(() => InterviewSession, (session) => session.practices)
  @JoinColumn({ name: 'sessionId' })
  session: InterviewSession;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
