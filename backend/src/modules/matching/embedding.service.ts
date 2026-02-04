import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from '../../entities/persona.entity';
import { JobPosting } from '../../entities/job-posting.entity';

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
}

export interface SemanticSimilarityResult {
  score: number;
  cosineSimilarity: number;
  topSkills: string[];
  topConcepts: string[];
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly DEFAULT_MODEL = 'text-embedding-3-small';
  private readonly EMBEDDING_DIMENSIONS = 1536;

  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(JobPosting)
    private readonly jobPostingRepository: Repository<JobPosting>,
  ) {}

  /**
   * Generate embedding for a text using OpenAI embeddings API
   * Falls back to mock embeddings for development
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      // Check if OpenAI API key is available
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (apiKey && apiKey !== 'mock_key') {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.DEFAULT_MODEL,
            input: text,
            dimensions: this.EMBEDDING_DIMENSIONS,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          embedding: data.data[0].embedding,
          model: this.DEFAULT_MODEL,
          dimensions: this.EMBEDDING_DIMENSIONS,
        };
      }
    } catch (error) {
      this.logger.warn(`OpenAI API unavailable, using mock embeddings: ${error}`);
    }

    // Fallback: Generate deterministic mock embedding based on text hash
    return this.generateMockEmbedding(text);
  }

  /**
   * Generate deterministic mock embedding for development
   */
  private generateMockEmbedding(text: string): EmbeddingResult {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(this.EMBEDDING_DIMENSIONS).fill(0);
    
    // Create a consistent hash-based embedding
    words.forEach((word, index) => {
      const hash = this.hashString(word);
      const position = hash % this.EMBEDDING_DIMENSIONS;
      const weight = 1 / (index + 1); // Earlier words have higher weight
      embedding[position] += weight;
    });

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = magnitude > 0 
      ? embedding.map(val => val / magnitude)
      : embedding;

    return {
      embedding: normalizedEmbedding,
      model: 'mock-embedding-v1',
      dimensions: this.EMBEDDING_DIMENSIONS,
    };
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embedding dimensions must match');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator > 0 ? dotProduct / denominator : 0;
  }

  /**
   * Find similar personas using pgvector similarity search
   */
  async findSimilarPersonas(
    queryEmbedding: number[],
    limit: number = 10,
    tenantId: string,
  ): Promise<{ persona: Persona; similarity: number }[]> {
    // Use pgvector similarity search if available
    // This requires the embedding column to be properly configured
    try {
      const result = await this.personaRepository
        .createQueryBuilder('persona')
        .where('persona.tenantId = :tenantId', { tenantId })
        .andWhere('persona.embedding IS NOT NULL')
        .orderBy('persona.embedding <=> :embedding', 'ASC')
        .setParameters({ embedding: `[${queryEmbedding.join(',')}]` })
        .limit(limit)
        .getMany();

      return result.map(persona => ({
        persona,
        similarity: this.calculateCosineSimilarity(
          queryEmbedding,
          this.parseEmbedding(persona.embedding as any),
        ),
      }));
    } catch (error) {
      this.logger.warn(`Vector search failed, using fallback: ${error}`);
      return [];
    }
  }

  /**
   * Find similar job postings using pgvector similarity search
   */
  async findSimilarJobs(
    queryEmbedding: number[],
    limit: number = 10,
    tenantId: string,
  ): Promise<{ jobPosting: JobPosting; similarity: number }[]> {
    try {
      const result = await this.jobPostingRepository
        .createQueryBuilder('job')
        .where('job.tenantId = :tenantId', { tenantId })
        .andWhere('job.embedding IS NOT NULL')
        .andWhere('job.isExpired = :isExpired', { isExpired: false })
        .orderBy('job.embedding <=> :embedding', 'ASC')
        .setParameters({ embedding: `[${queryEmbedding.join(',')}]` })
        .limit(limit)
        .getMany();

      return result.map(job => ({
        jobPosting: job,
        similarity: this.calculateCosineSimilarity(
          queryEmbedding,
          this.parseEmbedding(job.embedding as any),
        ),
      }));
    } catch (error) {
      this.logger.warn(`Vector search failed, using fallback: ${error}`);
      return [];
    }
  }

  /**
   * Parse embedding from database format
   */
  private parseEmbedding(embedding: string | null): number[] {
    if (!embedding) return [];
    if (typeof embedding === 'string') {
      try {
        return JSON.parse(embedding);
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Perform semantic skill analysis
   */
  async analyzeSkillsSemantically(
    personaSkills: any[],
    jobSkills: any[],
  ): Promise<SemanticSimilarityResult> {
    const personaSkillsText = this.skillsToText(personaSkills);
    const jobSkillsText = this.skillsToText(jobSkills);

    const personaEmbedding = await this.generateEmbedding(personaSkillsText);
    const jobEmbedding = await this.generateEmbedding(jobSkillsText);

    const cosineSimilarity = this.calculateCosineSimilarity(
      personaEmbedding.embedding,
      jobEmbedding.embedding,
    );

    // Extract key skills and concepts
    const topSkills = this.extractKeySkills(personaSkills, jobSkills);
    const topConcepts = this.extractConcepts(personaSkillsText + ' ' + jobSkillsText);

    return {
      score: (cosineSimilarity + 1) / 2, // Normalize to 0-1
      cosineSimilarity,
      topSkills,
      topConcepts,
    };
  }

  /**
   * Convert skills array to text
   */
  private skillsToText(skills: any[]): string {
    return skills
      .map(skill => typeof skill === 'string' ? skill : (skill.name || ''))
      .filter(Boolean)
      .join(' ');
  }

  /**
   * Extract key matching skills
   */
  private extractKeySkills(personaSkills: any[], jobSkills: any[]): string[] {
    const personaSkillNames = new Set(
      personaSkills.map(s => (typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase())).filter(Boolean),
    );

    return jobSkills
      .filter(skill => {
        const name = typeof skill === 'string' ? skill.toLowerCase() : skill.name?.toLowerCase();
        return name && personaSkillNames.has(name);
      })
      .slice(0, 5)
      .map(skill => typeof skill === 'string' ? skill : skill.name);
  }

  /**
   * Extract key concepts from text
   */
  private extractConcepts(text: string): string[] {
    const stopWords = new Set([
      'and', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'from', 'by',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10);
  }

  /**
   * Generate embedding for a persona profile
   */
  async generatePersonaEmbedding(persona: Partial<Persona>): Promise<EmbeddingResult> {
    const text = [
      persona.jobTitle,
      persona.summary,
      ...this.skillsToText((persona.skills as any[]) || []),
    ].filter(Boolean).join(' ');

    return this.generateEmbedding(text);
  }

  /**
   * Generate embedding for a job posting
   */
  async generateJobEmbedding(jobPosting: Partial<JobPosting>): Promise<EmbeddingResult> {
    const text = [
      jobPosting.title,
      jobPosting.description,
      ...this.skillsToText((jobPosting.skills as any[]) || []),
    ].filter(Boolean).join(' ');

    return this.generateEmbedding(text);
  }
}
