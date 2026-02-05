import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('interview_sessions')
export class InterviewSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  jobId: string;

  @Column({ type: 'jsonb', nullable: true })
  questionBank: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  answers: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  feedback: Record<string, any>;

  @Column({ type: 'float', nullable: true })
  overallScore: number;

  @Column({ type: 'jsonb', nullable: true })
  improvementAreas: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
