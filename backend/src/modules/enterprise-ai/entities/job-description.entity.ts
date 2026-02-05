import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('job_descriptions')
export class JobDescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  department: string;

  @Column({ type: 'jsonb' })
  content: Record<string, any>;

  @Column({ default: true })
  eeocCompliant: boolean;

  @Column({ type: 'jsonb', nullable: true })
  salaryRange: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  templatesUsed: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
