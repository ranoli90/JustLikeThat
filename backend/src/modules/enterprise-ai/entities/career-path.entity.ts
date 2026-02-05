import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('career_paths')
export class CareerPath {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  currentRole: string;

  @Column()
  targetRole: string;

  @Column({ type: 'jsonb' })
  skillGapAnalysis: Record<string, any>;

  @Column({ type: 'jsonb' })
  milestones: Record<string, any>[];

  @Column({ type: 'jsonb', nullable: true })
  certifications: Record<string, any>[];

  @Column({ type: 'jsonb' })
  timeline: Record<string, any>;

  @Column({ type: 'float', default: 0 })
  progress: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
