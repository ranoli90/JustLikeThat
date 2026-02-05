// Performance Optimization Entities - Sprint 48
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('performance_snapshots')
@Index(['serviceName', 'timestamp'])
export class PerformanceSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  serviceName: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'json' })
  metrics: Record<string, any>; // CPU, memory, latency, throughput

  @Column({ type: 'json', nullable: true })
  apmData: Record<string, any>; // APM-specific metrics

  @Column({ type: 'json', nullable: true })
  databaseMetrics: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  cacheMetrics: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

// Optimization Recommendation Entity
@Entity('optimization_recommendations')
@Index(['category', 'status'])
export class OptimizationRecommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  category: string; // performance, cost, security

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  impact: string; // high, medium, low

  @Column({ type: 'varchar', length: 20 })
  effort: string; // high, medium, low

  @Column({ type: 'varchar', length: 20, default: 'reviewed' })
  status: string; // reviewed, approved, implemented, rejected

  @CreateDateColumn()
  createdAt: Date;
}

// Load Test Result Entity
@Entity('load_test_results')
@Index(['serviceName', 'timestamp'])
export class LoadTestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  testName: string;

  @Column({ type: 'varchar', length: 100 })
  serviceName: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'int' })
  vusers: number; // Virtual users

  @Column({ type: 'int' })
  duration: number; // Duration in seconds

  @Column({ type: 'bigint' })
  requestsTotal: number;

  @Column({ type: 'float' })
  requestsPerSec: number;

  @Column({ type: 'float' })
  avgLatency: number; // in milliseconds

  @Column({ type: 'float' })
  p95Latency: number;

  @Column({ type: 'float' })
  p99Latency: number;

  @Column({ type: 'float' })
  errorRate: number;

  @Column({ type: 'varchar', length: 20 })
  status: string; // passed, failed, degraded
}

// Cache Metrics Entity
@Entity('cache_metrics')
@Index(['serviceName', 'timestamp'])
export class CacheMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  serviceName: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'bigint' })
  hits: number;

  @Column({ type: 'bigint' })
  misses: number;

  @Column({ type: 'bigint' })
  evictions: number;

  @Column({ type: 'float' })
  hitRate: number;

  @Column({ type: 'int' })
  avgTtl: number; // Average TTL in seconds

  @CreateDateColumn()
  createdAt: Date;
}
