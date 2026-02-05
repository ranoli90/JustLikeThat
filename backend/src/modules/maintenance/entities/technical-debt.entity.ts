// Technical Debt Entity - Sprint 48
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('technical_debt')
@Index(['category', 'severity'])
@Index(['status'])
export class TechnicalDebt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  category: string; // code, database, security, performance

  @Column({ type: 'varchar', length: 20 })
  severity: string; // critical, high, medium, low

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 500 })
  filePath: string;

  @Column({ type: 'int', nullable: true })
  lineNumber: number;

  @Column({ type: 'float', default: 0 })
  estimatedHours: number;

  @Column({ type: 'float', nullable: true })
  actualHours: number;

  @Column({ type: 'varchar', length: 20, default: 'identified' })
  status: string; // identified, planned, in_progress, completed, accepted

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
