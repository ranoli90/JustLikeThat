import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource, EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';

interface QueryMetrics {
  query: string;
  executionTime: number;
  timestamp: Date;
  parameters: any;
}

interface IndexRecommendation {
  tableName: string;
  columnName: string;
  currentIndexType: string | null;
  recommendation: string;
  estimatedImprovement: string;
}

interface QueryOptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  explanation: string;
  estimatedSpeedup: number;
}

@Injectable()
export class DatabaseOptimizationService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseOptimizationService.name);
  private queryMetrics: QueryMetrics[] = [];
  private readonly MAX_METRICS = 10000;

  constructor(
    @InjectRepository(EntityManager)
    private readonly entityManager: EntityManager,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.createPerformanceIndexes();
    await this.analyzeQueryPerformance();
  }

  /**
   * Create optimized indexes for common query patterns
   */
  async createPerformanceIndexes(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // User-related indexes
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_user_tenant ON users(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_user_created_at ON users(created_at);
      `);

      // Application-related indexes
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_application_user ON applications(user_id);
        CREATE INDEX IF NOT EXISTS idx_application_status ON applications(status);
        CREATE INDEX IF NOT EXISTS idx_application_created_at ON applications(created_at);
        CREATE INDEX IF NOT EXISTS idx_application_job_posting ON applications(job_posting_id);
      `);

      // Job posting indexes
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_job_posting_tenant ON job_postings(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_job_posting_location ON job_postings(location);
        CREATE INDEX IF NOT EXISTS idx_job_posting_remote ON job_postings(is_remote);
        CREATE INDEX IF NOT EXISTS idx_job_posting_created_at ON job_postings(created_at);
        CREATE INDEX IF NOT EXISTS idx_job_posting_status ON job_postings(status);
      `);

      // Composite indexes for common queries
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_app_user_status ON applications(user_id, status);
        CREATE INDEX IF NOT EXISTS idx_app_status_created ON applications(status, created_at);
        CREATE INDEX IF NOT EXISTS idx_job_tenant_status ON job_postings(tenant_id, status);
      `);

      // Resume and profile indexes
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_resume_user ON resumes(user_id);
        CREATE INDEX IF NOT EXISTS idx_profile_user ON candidate_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_persona_user ON personas(user_id);
      `);

      // Outreach indexes
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_campaign_user ON outreach_campaigns(user_id);
        CREATE INDEX IF NOT EXISTS idx_campaign_status ON outreach_campaigns(status);
        CREATE INDEX IF NOT EXISTS idx_contact_campaign ON outreach_contacts(campaign_id);
      `);

      await queryRunner.commitTransaction();
      this.logger.log('Performance indexes created successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create performance indexes', error);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Analyze and optimize slow queries
   */
  async analyzeQueryPerformance(): Promise<QueryOptimizationResult[]> {
    const slowQueries = this.queryMetrics.filter(q => q.executionTime > 100);
    const optimizations: QueryOptimizationResult[] = [];

    for (const query of slowQueries) {
      const optimization = await this.optimizeQuery(query.query);
      if (optimization) {
        optimizations.push(optimization);
      }
    }

    return optimizations;
  }

  /**
   * Optimize a specific query
   */
  async optimizeQuery(query: string): Promise<QueryOptimizationResult | null> {
    // Common query patterns that need optimization
    const patterns = [
      {
        pattern: /SELECT \*/i,
        fix: 'SELECT specific columns only',
        explanation: 'Replace SELECT * with specific columns to reduce data transfer',
        speedup: 2,
      },
      {
        pattern: /WHERE .+ OR .+/i,
        fix: 'Use IN clause or UNION instead of OR',
        explanation: 'OR conditions can prevent index usage; consider UNION or IN clause',
        speedup: 3,
      },
      {
        pattern: /LIKE '%[^%]%'/i,
        fix: 'Use full-text search or indexed search patterns',
        explanation: 'Leading wildcard in LIKE prevents index usage',
        speedup: 10,
      },
      {
        pattern: /ORDER BY RAND\(\)/i,
        fix: 'Use TABLESAMPLE or alternative randomization methods',
        explanation: 'ORDER BY RAND() is extremely slow on large tables',
        speedup: 100,
      },
      {
        pattern: /NOT IN/i,
        fix: 'Consider using NOT EXISTS or LEFT JOIN with IS NULL',
        explanation: 'NOT IN can be slow with large result sets; consider alternatives',
        speedup: 2,
      },
    ];

    for (const pattern of patterns) {
      if (pattern.pattern.test(query)) {
        return {
          originalQuery: query,
          optimizedQuery: query.replace(pattern.pattern, pattern.fix),
          explanation: pattern.explanation,
          estimatedSpeedup: pattern.speedup,
        };
      }
    }

    return null;
  }

  /**
   * Record query execution metrics
   */
  recordQueryMetrics(query: string, executionTime: number, parameters?: any): void {
    this.queryMetrics.push({
      query,
      executionTime,
      timestamp: new Date(),
      parameters,
    });

    // Keep only recent metrics
    if (this.queryMetrics.length > this.MAX_METRICS) {
      this.queryMetrics = this.queryMetrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Get slow queries report
   */
  getSlowQueries(thresholdMs: number = 100): QueryMetrics[] {
    return this.queryMetrics
      .filter(q => q.executionTime > thresholdMs)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 100);
  }

  /**
   * Get query statistics
   */
  getQueryStatistics(): {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueryCount: number;
    percentile95: number;
    percentile99: number;
  } {
    if (this.queryMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageExecutionTime: 0,
        slowQueryCount: 0,
        percentile95: 0,
        percentile99: 0,
      };
    }

    const executionTimes = this.queryMetrics.map(q => q.executionTime).sort((a, b) => a - b);
    const total = executionTimes.reduce((a, b) => a + b, 0);

    const percentile = (arr: number[], p: number) => {
      const index = Math.ceil((p / 100) * arr.length) - 1;
      return arr[Math.max(0, index)];
    };

    return {
      totalQueries: this.queryMetrics.length,
      averageExecutionTime: Math.round(total / executionTimes.length),
      slowQueryCount: executionTimes.filter(t => t > 100).length,
      percentile95: percentile(executionTimes, 95),
      percentile99: percentile(executionTimes, 99),
    };
  }

  /**
   * Get index recommendations based on query patterns
   */
  async getIndexRecommendations(): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];
    const slowQueries = this.getSlowQueries(50);

    for (const query of slowQueries) {
      // Analyze WHERE clause patterns
      const whereMatch = query.query.match(/WHERE\s+(\w+)\s*[=<>]/gi);
      if (whereMatch) {
        for (const match of whereMatch) {
          const columnMatch = match.match(/WHERE\s+(\w+)/i);
          if (columnMatch) {
            recommendations.push({
              tableName: 'Unknown',
              columnName: columnMatch[1],
              currentIndexType: null,
              recommendation: `Consider adding an index on ${columnMatch[1]}`,
              estimatedImprovement: '50-90% query time reduction',
            });
          }
        }
      }
    }

    return recommendations;
  }

  /**
   * Execute query with timing
   */
  async executeWithTiming<T>(
    query: string,
    parameters?: any[],
    callback?: (metrics: QueryMetrics) => void,
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await this.entityManager.query(query, parameters);
      const executionTime = Date.now() - startTime;

      const metrics: QueryMetrics = {
        query,
        executionTime,
        timestamp: new Date(),
        parameters,
      };

      this.recordQueryMetrics(query, executionTime, parameters);
      callback?.(metrics);

      return result as T;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Query failed: ${query}`, { executionTime, error });
      throw error;
    }
  }

  /**
   * Batch insert optimization
   */
  async batchInsert<T>(
    tableName: string,
    data: Partial<T>[],
    batchSize: number = 100,
  ): Promise<number> {
    let insertedCount = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const columns = Object.keys(batch[0]);
      const values = batch.map(row => `(${columns.map(c => `'${row[c]}'`).join(', ')})`).join(', ');
      
      const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${values}`;
      await this.entityManager.query(query);
      
      insertedCount += batch.length;
    }

    return insertedCount;
  }

  /**
   * Get table statistics
   */
  async getTableStatistics(): Promise<{
    tableName: string;
    rowCount: number;
    tableSize: string;
    indexSize: string;
    lastVacuum: Date | null;
  }[]> {
    const query = `
      SELECT 
        relname AS table_name,
        n_live_tup AS row_count,
        pg_size_pretty(pg_relation_size(relid)) AS table_size,
        pg_size_pretty(pg_indexes_size(relid)) AS index_size,
        last_vacuum
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `;

    return this.entityManager.query(query);
  }
}
