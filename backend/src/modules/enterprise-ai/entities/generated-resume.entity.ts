import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('generated_resumes')
export class GeneratedResume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  templateId: string;

  @Column({ type: 'jsonb' })
  content: Record<string, any>;

  @Column({ type: 'float', nullable: true })
  atsScore: number;

  @Column({ type: 'float', nullable: true })
  keywordsScore: number;

  @Column({ type: 'float', nullable: true })
  formatScore: number;

  @Column({ type: 'jsonb', nullable: true })
  exportedFormats: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
