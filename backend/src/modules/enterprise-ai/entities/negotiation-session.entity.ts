import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('negotiation_sessions')
export class NegotiationSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  jobOfferId: string;

  @Column({ type: 'jsonb' })
  currentOffer: Record<string, any>;

  @Column({ type: 'jsonb' })
  marketSalary: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  counterOffer: Record<string, any>;

  @Column({ type: 'jsonb' })
  negotiationScript: Record<string, any>;

  @Column({ type: 'float', nullable: true })
  successPrediction: number;

  @Column({ nullable: true })
  outcome: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
