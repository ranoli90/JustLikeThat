import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { JobSource } from './job-source.entity';

export enum RemotePreference {
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
  ONSITE = 'ONSITE',
}

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
}

@Entity('job_postings')
export class JobPosting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ nullable: true })
  jobSourceId: string;

  @Column()
  title: string;

  @Column()
  company: string;

  @Column()
  location: string;

  @Column({ type: 'enum', enum: RemotePreference })
  remotePreference: RemotePreference;

  @Column({ type: 'enum', enum: JobType })
  jobType: JobType;

  @Column({ type: 'jsonb', nullable: true })
  salaryRange: any;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  requirements: any;

  @Column({ type: 'jsonb', nullable: true })
  skills: any;

  @Column({ type: 'jsonb', nullable: true })
  experiences: any;

  @Column()
  applyUrl: string;

  @Column({ default: false })
  isExpired: boolean;

  @Column({ type: 'vector', nullable: true, array: true })
  embedding: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
