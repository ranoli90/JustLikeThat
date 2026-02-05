// Dependency Update Entity - Sprint 48
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('dependency_updates')
@Index(['status'])
@Index(['packageName'])
export class DependencyUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  packageName: string;

  @Column({ type: 'varchar', length: 50 })
  currentVersion: string;

  @Column({ type: 'varchar', length: 50 })
  latestVersion: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vulnerabilityRisk: string;

  @Column({ type: 'varchar', length: 20, default: 'unknown' })
  compatibility: string; // compatible, breaking, unknown

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // pending, testing, approved, rejected, applied

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor: Date;

  @Column({ type: 'timestamp', nullable: true })
  appliedAt: Date;

  @Column({ type: 'text', nullable: true })
  changelog: string;

  @Column({ type: 'text', nullable: true })
  breakingChanges: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Dependency Inventory Entity
@Entity('dependency_inventory')
@Unique(['packageName', 'currentVersion'])
@Index(['updateAvailable'])
export class DependencyInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  packageName: string;

  @Column({ type: 'varchar', length: 50 })
  currentVersion: string;

  @Column({ type: 'varchar', length: 50 })
  latestVersion: string;

  @Column({ type: 'varchar', length: 100 })
  licenseType: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastChecked: Date;

  @Column({ type: 'boolean', default: false })
  updateAvailable: boolean;
}
