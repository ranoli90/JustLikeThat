import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CertificationStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  RENEWAL_REQUIRED = 'renewal_required',
}

@Entity('certifications')
export class Certification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  issuingOrganization: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  credentialId: string;

  @Column({ type: 'date', nullable: true })
  issueDate: Date;

  @Column({ type: 'date', nullable: true })
  expirationDate: Date;

  @Column({ type: 'enum', enum: CertificationStatus, default: CertificationStatus.PLANNED })
  status: CertificationStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  category: string;

  @Column({ type: 'jsonb', nullable: true })
  skills: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string;

  @Column({ type: 'int', nullable: true })
  estimatedCost: number;

  @Column({ type: 'int', nullable: true })
  estimatedHours: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  difficulty: string;

  @Column({ type: 'jsonb', nullable: true })
  prerequisites: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  renewalRequirements: string;

  @Column({ type: 'int', nullable: true })
  renewalCost: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('certification_templates')
export class CertificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  issuingOrganization: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string;

  @Column({ type: 'int', nullable: true })
  estimatedCost: number;

  @Column({ type: 'int', nullable: true })
  estimatedHours: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  difficulty: string;

  @Column({ type: 'jsonb', nullable: true })
  skills: string[];

  @Column({ type: 'jsonb', nullable: true })
  prerequisites: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  renewalRequirements: string;

  @Column({ type: 'int', nullable: true })
  renewalCost: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
