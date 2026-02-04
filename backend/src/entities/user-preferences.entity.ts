import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.preferences)
  @JoinColumn()
  user: User;

  @Column()
  jobTitle: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  remotePreference: string; // 'remote', 'hybrid', 'onsite'

  @Column('simple-array', { nullable: true })
  jobTypes: string[]; // ['full_time', 'part_time', 'contract']

  @Column({ nullable: true })
  minSalary: number;

  @Column({ nullable: true })
  maxSalary: number;

  @Column('simple-array', { nullable: true })
  industries: string[];

  @Column('simple-array', { nullable: true })
  skillKeywords: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
