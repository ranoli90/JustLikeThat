import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { InterviewSession } from './interview-session.entity';

@Entity('company_insights')
export class CompanyInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;

  @Column({ type: 'text', nullable: true })
  culture: string | null;

  @Column({ type: 'json', nullable: true })
  values: string[] | null;

  @Column({ type: 'json', nullable: true })
  benefits: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  interviewProcess: string | null;

  @Column({ type: 'json', nullable: true })
  tips: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  salaryRange: { min: number; max: number; currency: string } | null;

  @Column({ type: 'json', nullable: true })
  recentNews: Record<string, unknown>[] | null;

  @Column({ type: 'float', nullable: true })
  glassdoorRating: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToOne(() => InterviewSession, (session) => session.company)
  @JoinColumn({ name: 'id' })
  session: InterviewSession;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
