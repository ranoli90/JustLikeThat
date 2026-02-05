// Security Patch Entity - Sprint 48
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('security_patches')
@Index(['severity', 'status'])
@Index(['vulnerabilityId'])
export class SecurityPatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  vulnerabilityId: string; // CVE or internal ID

  @Column({ type: 'varchar', length: 20 })
  severity: string; // critical, high, medium, low

  @Column({ type: 'simple-array' })
  affectedSystems: string[];

  @Column({ type: 'varchar', length: 50 })
  patchVersion: string;

  @Column({ type: 'varchar', length: 20, default: 'available' })
  status: string; // available, testing, deployed, failed

  @Column({ type: 'timestamp', nullable: true })
  deployedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

// Security Vulnerability Entity
@Entity('security_vulnerabilities')
@Index(['severity', 'status'])
@Index(['cveId'])
export class SecurityVulnerability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cveId: string; // CVE-2024-1234

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  severity: string;

  @Column({ type: 'float', nullable: true })
  cvssScore: number;

  @Column({ type: 'varchar', length: 200 })
  affectedPackage: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fixedVersion: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string; // open, in_progress, resolved, ignored

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  scannedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;
}
