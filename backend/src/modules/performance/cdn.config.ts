/**
 * CDN Configuration
 * 
 * Integration with CDN providers (Cloudflare, AWS CloudFront, etc.)
 * for static asset delivery optimization.
 */

export interface CDNConfig {
  provider: 'cloudflare' | 'cloudfront' | 'fastly' | 'custom';
  zoneId?: string;
  domain: string;
  apiToken?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  distributionId?: string;
  cacheSettings: {
    staticAssets: {
      images: number;
      scripts: number;
      styles: number;
      fonts: number;
      documents: number;
    };
    apiResponses: {
      public: number;
      private: number;
    };
    htmlPages: {
      cached: number;
      uncached: number;
    };
  };
  optimizations: {
    imageOptimization: boolean;
    brotliCompression: boolean;
    edgeCompute: boolean;
    mobileOptimization: boolean;
  };
  security: {
    hotlinkProtection: boolean;
    rateLimiting: boolean;
    wafEnabled: boolean;
    ipRules: string[];
  };
}

export const cdnConfig: CDNConfig = {
  provider: 'cloudflare',
  domain: 'cdn.example.com',
  cacheSettings: {
    staticAssets: {
      images: 2592000, // 30 days
      scripts: 604800, // 7 days
      styles: 604800, // 7 days
      fonts: 2592000, // 30 days
      documents: 86400, // 1 day
    },
    apiResponses: {
      public: 300, // 5 minutes
      private: 0, // No cache
    },
    htmlPages: {
      cached: 300,
      uncached: 0,
    },
  },
  optimizations: {
    imageOptimization: true,
    brotliCompression: true,
    edgeCompute: false,
    mobileOptimization: true,
  },
  security: {
    hotlinkProtection: true,
    rateLimiting: true,
    wafEnabled: true,
    ipRules: [],
  },
};

/**
 * Static asset patterns for CDN routing
 */
export const staticAssetPatterns = {
  images: /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/,
  scripts: /\.(js|mjs)$/,
  styles: /\.(css|scss|sass|less)$/,
  fonts: /\.(woff|woff2|ttf|eot|otf)$/,
  documents: /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/,
  videos: /\.(mp4|webm|mov|avi)$/,
  audio: /\.(mp3|wav|ogg)$/,
  archives: /\.(zip|tar|gz|7z)$/,
};

/**
 * Cache control headers for different asset types
 */
export const cacheControlHeaders = {
  immutable: 'public, max-age=31536000, immutable',
  longTerm: 'public, max-age=2592000',
  shortTerm: 'public, max-age=86400',
  noStore: 'private, no-store, no-cache, must-revalidate',
  noCache: 'no-cache, must-revalidate',
};

/**
 * Purge cache options
 */
export interface CachePurgeOptions {
  purgeAll: boolean;
  urls?: string[];
  tags?: string[];
  hostnames?: string[];
}

export const defaultPurgeOptions: CachePurgeOptions = {
  purgeAll: false,
  urls: [],
  tags: [],
  hostnames: [],
};
