// Code Quality Metrics Entity - Sprint 48
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('code_quality_metrics')
@Index(['serviceName', 'date'])
export class CodeQualityMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  serviceName: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({ type: 'float', default: 0 })
  coverage: number;

  @Column({ type: 'float', default: 0 })
  complexity: number;

  @Column({ type: 'float', default: 0 })
  duplication: number;

  @Column({ type: 'varchar', length: 20, default: 'A' })
  securityRating: string;

  @Column({ type: 'float', default: 0 })
  maintainability: number;

  @Column({ type: 'float', default: 0 })
  technicalDebt: number; // percentage

  @CreateDateColumn()
  createdAt: Date;
}
