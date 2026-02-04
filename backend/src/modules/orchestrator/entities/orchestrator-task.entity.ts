import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AgentType, TaskPriority, TaskStatus, TaskErrorType } from '../orchestrator.agents';

@Entity('orchestrator_tasks')
export class OrchestratorTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AgentType,
  })
  agentType: AgentType;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column('jsonb')
  data: any;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({ default: 0 })
  retryCount: number;

  @Column({
    type: 'enum',
    enum: TaskErrorType,
    nullable: true,
  })
  errorType: TaskErrorType | null;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string | null;

  @Column({ nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
