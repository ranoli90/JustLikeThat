import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Persona } from './persona.entity';

@Entity('candidate_profiles')
export class CandidateProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User;

  @OneToMany(() => Persona, (persona) => persona.profile)
  personas: Persona[];

  @Column({ nullable: true })
  headline: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'jsonb', nullable: true })
  experiences: any[];

  @Column({ type: 'jsonb', nullable: true })
  education: any[];

  @Column({ type: 'jsonb', nullable: true })
  skills: any[];

  @Column({ type: 'jsonb', nullable: true })
  certifications: any[];

  @Column({ type: 'jsonb', nullable: true })
  projects: any[];

  @Column({ type: 'jsonb', nullable: true })
  languages: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
