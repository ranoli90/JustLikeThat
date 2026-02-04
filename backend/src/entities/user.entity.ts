import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { CandidateProfile } from './candidate-profile.entity';
import { Resume } from './resume.entity';
import { UserPreferences } from './user-preferences.entity';
import { Feedback } from './feedback.entity';
import { ABTestAssignment } from './ab-test.entity';
import { Survey } from './survey.entity';

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

  @OneToMany(() => Feedback, (feedback) => feedback.user)
  feedbacks: Feedback[];

  @OneToMany(() => ABTestAssignment, (assignment) => assignment.user)
  abTestAssignments: ABTestAssignment[];

  @OneToMany(() => Survey, (survey) => survey.user)
  surveys: Survey[];
}
