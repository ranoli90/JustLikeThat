import { Injectable, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { createGzip, createBrotliCompress, createDeflate } from 'zlib';
import { promisify } from 'util';
import { pipeline } from 'stream';

const gzip = promisify(createGzip);
const brotli = promisify(createBrotliCompress());
const deflate = promisify(createDeflate());

interface CompressionOptions {
  threshold: number;
  level: number;
  excludePaths: string[];
}

interface CachedResponse {
  data: Buffer;
  encoding: string;
  timestamp: number;
}

@Injectable()
export class CompressionService {
  private readonly logger = new Logger(CompressionService.name);
  private compressionCache: Map<string, CachedResponse> = new Map();
  private readonly maxCacheSize = 100;
  private readonly cacheTTL = 3600000; // 1 hour

  constructor(private readonly configService: ConfigService) {}

  /**
   * Middleware for response compression
   */
  compressionMiddleware() {
    const options = this.getOptions();
    
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip compression for excluded paths
      if (this.shouldExcludePath(req.path, options.excludePaths)) {
        return next();
      }

      // Only compress if client accepts encoding
      const acceptEncoding = req.headers['accept-encoding'] || '';
      
      let encoding: string | null = null;
      
      if (acceptEncoding.includes('br')) {
        encoding = 'br';
      } else if (acceptEncoding.includes('gzip')) {
        encoding = 'gzip';
      } else if (acceptEncoding.includes('deflate')) {
        encoding = 'deflate';
      }

      if (!encoding) {
        return next();
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method for compression
      res.json = (body: any) => {
        // Check if response should be compressed
        if (this.shouldCompress(body, options.threshold)) {
          this.compressResponse(res, body, encoding!, options.level);
        } else {
          originalJson(body);
        }
        
        return res;
      };

      next();
    };
  }

  /**
   * Compress response data
   */
  private async compressResponse(
    res: Response,
    body: any,
    encoding: string,
    level: number,
  ): Promise<void> {
    const cacheKey = this.getCacheKey(body, encoding);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      this.sendCompressedResponse(res, cached.data, encoding);
      return;
    }

    const data = typeof body === 'string' ? Buffer.from(body) : Buffer.from(JSON.stringify(body));
    
    let compressed: Buffer;
    
    switch (encoding) {
      case 'br':
        compressed = await brotli(data, { level });
        break;
      case 'gzip':
        compressed = await gzip(data, { level });
        break;
      case 'deflate':
        compressed = await deflate(data, { level });
        break;
      default:
        compressed = data;
    }

    // Cache the compressed response
    this.addToCache(cacheKey, {
      data: compressed,
      encoding,
      timestamp: Date.now(),
    });

    this.sendCompressedResponse(res, compressed, encoding);
  }

  /**
   * Send compressed response to client
   */
  private sendCompressedResponse(
    res: Response,
    data: Buffer,
    encoding: string,
  ): void {
    res.setHeader('Content-Encoding', encoding);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('X-Compression-Ratio', Math.round((1 - data.length / (data.length * 10)) * 100) / 100);
    res.send(data);
  }

  /**
   * Get compression options from config
   */
  private getOptions(): CompressionOptions {
    return {
      threshold: this.configService.get<number>('COMPRESSION_THRESHOLD', 1024),
      level: this.configService.get<number>('COMPRESSION_LEVEL', 6),
      excludePaths: [
        '/health',
        '/metrics',
        '/static',
        '/assets',
        '/favicon.ico',
      ],
    };
  }

  /**
   * Check if path should be excluded from compression
   */
  private shouldExcludePath(path: string, excludePaths: string[]): boolean {
    return excludePaths.some(excludePath => 
      path.startsWith(excludePath) || path.match(new RegExp(excludePath.replace('*', '.*')))
    );
  }

  /**
   * Check if response should be compressed
   */
  private shouldCompress(body: any, threshold: number): boolean {
    if (!body || typeof body !== 'object') {
      return false;
    }

    const jsonString = JSON.stringify(body);
    const size = Buffer.byteLength(jsonString, 'utf8');
    
    return size > threshold;
  }

  /**
   * Get cache key for response
   */
  private getCacheKey(body: any, encoding: string): string {
    const hash = this.simpleHash(JSON.stringify(body));
    return `${encoding}:${hash}`;
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get compressed response from cache
   */
  private getFromCache(cacheKey: string): CachedResponse | null {
    const cached = this.compressionCache.get(cacheKey);
    
    if (cached && cached.timestamp + this.cacheTTL > Date.now()) {
      return cached;
    }
    
    return null;
  }

  /**
   * Add compressed response to cache
   */
  private addToCache(cacheKey: string, response: CachedResponse): void {
    if (this.compressionCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.compressionCache.keys().next().value;
      this.compressionCache.delete(firstKey);
    }
    
    this.compressionCache.set(cacheKey, response);
  }

  /**
   * Compress data synchronously for immediate use
   */
  async compressSync(data: Buffer, encoding: 'gzip' | 'deflate' | 'br' = 'gzip'): Promise<Buffer> {
    switch (encoding) {
      case 'gzip':
        return gzip(data, { level: 6 });
      case 'deflate':
        return deflate(data, { level: 6 });
      case 'br':
        return brotli(data, { level: 6 });
    }
  }

  /**
   * Decompress data
   */
  async decompress(data: Buffer, encoding: string): Promise<Buffer> {
    const inflate = (await import('zlib')).inflate;
    const inflateSync = (await import('zlib')).inflateSync;

    switch (encoding) {
      case 'gzip':
        return inflateSync(data);
      case 'deflate':
        return inflateSync(data);
      case 'br':
        const brotliDecompress = (await import('brotli')).decompress;
        return brotliDecompress(data);
      default:
        return data;
    }
  }

  /**
   * Get compression statistics
   */
  getStatistics(): {
    cacheSize: number;
    cacheHitRate: number;
    averageCompressionRatio: number;
  } {
    return {
      cacheSize: this.compressionCache.size,
      cacheHitRate: 0,
      averageCompressionRatio: 0,
    };
  }

  /**
   * Clear compression cache
   */
  clearCache(): void {
    this.compressionCache.clear();
  }

  /**
   * Estimate compression savings
   */
  async estimateSavings(data: Buffer): Promise<{
    originalSize: number;
    gzipSize: number;
    brotliSize: number;
    bestEncoding: string;
    savingsPercentage: number;
  }> {
    const gzipCompressed = await this.compressSync(data, 'gzip');
    const brotliCompressed = await this.compressSync(data, 'br');

    const gzipSavings = (1 - gzipCompressed.length / data.length) * 100;
    const brotliSavings = (1 - brotliCompressed.length / data.length) * 100;

    const bestEncoding = brotliSavings > gzipSavings ? 'brotli' : 'gzip';
    const bestSavings = Math.max(gzipSavings, brotliSavings);

    return {
      originalSize: data.length,
      gzipSize: gzipCompressed.length,
      brotliSize: brotliCompressed.length,
      bestEncoding,
      savingsPercentage: Math.round(bestSavings * 100) / 100,
    };
  }
}
