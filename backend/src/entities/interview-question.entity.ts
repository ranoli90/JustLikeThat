import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InterviewSession } from './interview-session.entity';

export enum QuestionType {
  BEHAVIORAL = 'BEHAVIORAL',
  TECHNICAL = 'TECHNICAL',
  SITUATIONAL = 'SITUATIONAL',
  COMPANY_CULTURE = 'COMPANY_CULTURE',
  ROLE_SPECIFIC = 'ROLE_SPECIFIC',
  CAREER_GOALS = 'CAREER_GOALS',
  SALARY = 'SALARY',
  GENERAL = 'GENERAL',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

@Entity('interview_questions')
export class InterviewQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'enum', enum: QuestionType })
  questionType: QuestionType;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text', nullable: true })
  suggestedAnswer: string | null;

  @Column({ type: 'text', nullable: true })
  userAnswer: string | null;

  @Column({ type: 'enum', enum: Difficulty, default: Difficulty.MEDIUM })
  difficulty: Difficulty;

  @Column({ type: 'json', nullable: true })
  tags: string[] | null;

  @Column({ type: 'json', nullable: true })
  feedback: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false })
  isAnswered: boolean;

  @ManyToOne(() => InterviewSession, (session) => session.questions)
  @JoinColumn({ name: 'sessionId' })
  session: InterviewSession;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
