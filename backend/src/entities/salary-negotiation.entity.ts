import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('salary_negotiations')
export class SalaryNegotiation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  company: string;

  @Column({ type: 'varchar', length: 255 })
  position: string;

  @Column({ type: 'json', nullable: true })
  marketRange: { min: number; max: number; currency: string; source: string } | null;

  @Column({ type: 'int', nullable: true })
  targetSalary: number | null;

  @Column({ type: 'int', nullable: true })
  minimumAcceptable: number | null;

  @Column({ type: 'json', nullable: true })
  benefits: { type: string; value: number; notes: string }[] | null;

  @Column({ type: 'json', nullable: true })
  negotiationStrategy: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  talkingPoints: string[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
