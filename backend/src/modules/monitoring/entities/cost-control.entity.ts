import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CostControlType {
  LLM_CALL_LIMIT = 'llm_call_limit',
  API_RATE_LIMIT = 'api_rate_limit',
  BUDGET_MONITORING = 'budget_monitoring',
}

export enum CostControlStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRIGGERED = 'triggered',
}

@Entity('cost_controls')
export class CostControl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: CostControlType })
  type: CostControlType;

  @Column({ type: 'enum', enum: CostControlStatus, default: CostControlStatus.ACTIVE })
  status: CostControlStatus;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'float' })
  limit: number;

  @Column({ type: 'float', nullable: true })
  currentValue: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string;

  @Column({ type: 'jsonb', nullable: true })
  conditions: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  actions: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
