import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { CandidateProfile } from './candidate-profile.entity';
import { Resume } from './resume.entity';
import { UserPreferences } from './user-preferences.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: false })
  lastName: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: false })
  onboardingCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => CandidateProfile, (profile) => profile.user)
  profile: CandidateProfile;

  @OneToOne(() => UserPreferences, (preferences) => preferences.user)
  preferences: UserPreferences;

  @OneToMany(() => Resume, (resume) => resume.user)
  resumes: Resume[];
}
