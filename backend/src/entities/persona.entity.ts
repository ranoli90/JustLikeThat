import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { CandidateProfile } from './candidate-profile.entity';

export enum ExperienceLevel {
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
}

@Entity('personas')
export class Persona {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CandidateProfile, (profile) => profile.personas)
  profile: CandidateProfile;

  @Column()
  name: string;

  @Column()
  jobTitle: string;

  @Column({ type: 'enum', enum: ExperienceLevel })
  experienceLevel: ExperienceLevel;

  @Column({ type: 'jsonb', nullable: true })
  skills: any[];

  @Column({ type: 'text', nullable: true })
  summary: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
