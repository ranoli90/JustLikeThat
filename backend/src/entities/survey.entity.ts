import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum SurveyProvider {
  TYPEFORM = 'TYPEFORM',
  SURVEYMONKEY = 'SURVEYMONKEY',
}

export enum SurveyStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
}

@Entity()
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  externalId: string;

  @Column({ type: 'enum', enum: SurveyProvider })
  provider: SurveyProvider;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  surveyUrl: string;

  @Column({ type: 'enum', enum: SurveyStatus, default: SurveyStatus.PENDING })
  status: SurveyStatus;

  @ManyToOne(() => User, (user) => user.surveys)
  user: User;

  @Column({ type: 'jsonb', nullable: true })
  response: any;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
