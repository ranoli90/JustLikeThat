import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('career_conversation')
export class CareerConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column('json')
  messages: any;

  @Column('json')
  context: any;

  @Column('json')
  recommendations: any;

  @Column('simple-array')
  resolvedTopics: string[];

  @Column({ type: 'float', nullable: true })
  sentiment: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('skill_assessment')
export class SkillAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column('json')
  assessedSkills: any;

  @Column()
  targetRole: string;

  @Column('json')
  gapAnalysis: any;

  @Column('json')
  recommendations: any;

  @Column({ type: 'float' })
  confidence: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('learning_path')
export class LearningPath {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  targetRole: string;

  @Column('json')
  courses: any;

  @Column('json')
  milestones: any;

  @Column()
  estimatedTime: number;

  @Column({ type: 'float', default: 0 })
  progress: number;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}

@Entity('trajectory_simulation')
export class TrajectorySimulation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  currentRole: string;

  @Column()
  targetRole: string;

  @Column('json')
  simulations: any;

  @Column('json')
  projections: any;

  @Column('json')
  recommendations: any;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('interview_practice')
export class InterviewPractice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  jobType: string;

  @Column('json')
  questions: any;

  @Column('json')
  answers: any;

  @Column('json')
  feedback: any;

  @Column({ type: 'float' })
  overallScore: number;

  @Column('json')
  improvements: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('market_trend')
export class MarketTrend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  category: string;

  @Column()
  name: string;

  @Column('json')
  data: any;

  @Column('json')
  forecast: any;

  @Column({ default: 'stable' })
  trend: string;

  @Column({ type: 'float' })
  confidence: number;

  @Column({ nullable: true })
  region: string;

  @CreateDateColumn()
  recordedAt: Date;
}

@Entity('career_goal')
export class CareerGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column()
  targetDate: Date;

  @Column('json')
  milestones: any;

  @Column({ type: 'float', default: 0 })
  progress: number;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
