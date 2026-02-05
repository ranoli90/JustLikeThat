import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cover_letters')
export class CoverLetter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  jobId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  tone: string;

  @Column({ type: 'jsonb', nullable: true })
  draftVersions: Record<string, any>[];

  @Column({ default: 0 })
  selectedVersion: number;

  @Column({ default: 'draft' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
