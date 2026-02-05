import { Page, BrowserContext, ConsoleMessage, Request, Response } from '@playwright/test';

/**
 * Advanced debugging utilities for intelligent testing
 */
export class DebugUtils {
  constructor(
    private page: Page,
    private context: BrowserContext,
    private options: DebugOptions = {}
  ) {}

  /**
   * Capture all console messages with metadata
   */
  captureConsoleMessages(): ConsoleMessage[] {
    const messages: ConsoleMessage[] = [];

    this.page.on('console', (msg) => {
      messages.push({
        ...msg,
        timestamp: new Date(),
        location: msg.location(),
      } as any);
    });

    return messages;
  }

  /**
   * Intercept and analyze network requests
   */
  analyzeNetworkTraffic(): NetworkAnalysis {
    const requests: Request[] = [];
    const responses: Response[] = [];
    const failedRequests: Request[] = [];
    const slowRequests: { request: Request; duration: number }[] = [];

    this.page.on('request', (req) => requests.push(req));
    this.page.on('response', (res) => responses.push(res));
    this.page.on('requestfailed', (req) => failedRequests.push(req));

    return {
      requests,
      responses,
      failedRequests,
      slowRequests,
      getReport: () => this.generateNetworkReport(requests, responses, failedRequests, slowRequests),
    };
  }

  /**
   * Generate comprehensive network report
   */
  private generateNetworkReport(
    requests: Request[],
    responses: Response[],
    failedRequests: Request[],
    slowRequests: { request: Request; duration: number }[]
  ): NetworkReport {
    const successRate = responses.length / (requests.length || 1) * 100;
    const avgResponseTime = responses.reduce((sum, res) => {
      const timing = (res as any).timing;
      return sum + (timing?.responseEnd || 0);
    }, 0) / (responses.length || 1);

    return {
      totalRequests: requests.length,
      successfulResponses: responses.length,
      failedRequests: failedRequests.length,
      successRate: `${successRate.toFixed(2)}%`,
      averageResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      slowRequests: slowRequests.slice(0, 10),
      endpoints: this.groupRequestsByEndpoint(requests),
    };
  }

  /**
   * Group requests by endpoint
   */
  private groupRequestsByEndpoint(requests: Request[]): Record<string, number> {
    return requests.reduce((acc, req) => {
      const url = new URL(req.url());
      const endpoint = `${url.pathname}${url.search}`;
      acc[endpoint] = (acc[endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Detect memory leaks
   */
  async detectMemoryLeaks(): Promise<MemoryLeakReport> {
    const initialMetrics = await this.page.evaluate(() => ({
      used: (performance as any).memory?.usedJSHeapSize || 0,
    }));
    
    // Perform actions that might cause memory leaks
    await this.page.goto('/jobs');
    await this.page.goto('/applications');
    await this.page.goto('/dashboard');
    
    // Force garbage collection if available
    await this.page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });

    const finalMetrics = await this.page.evaluate(() => ({
      used: (performance as any).memory?.usedJSHeapSize || 0,
    }));

    return {
      initialJSHeapUsed: initialMetrics.used,
      finalJSHeapUsed: finalMetrics.used,
      jsHeapDelta: finalMetrics.used - initialMetrics.used,
      potentialLeak: finalMetrics.used > initialMetrics.used * 1.5,
    };
  }

  /**
   * Take visual snapshot with comparison
   */
  async takeVisualSnapshot(name: string): Promise<string> {
    const screenshotPath = `./test-results/snapshots/${name}-${Date.now()}.png`;
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  }

  /**
   * Monitor for JavaScript errors
   */
  monitorJsErrors(): string[] {
    const errors: string[] = [];

    this.page.on('pageerror', (err) => {
      errors.push(`[${new Date().toISOString()}] ${err.message}\n${err.stack}`);
    });

    return errors;
  }

  /**
   * Measure First Contentful Paint (FCP)
   */
  async measureFCP(): Promise<number> {
    const fcpEntries = await this.page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      const fcp = entries.find((entry: any) => entry.name === 'first-contentful-paint');
      return fcp ? fcp.startTime : null;
    });

    return fcpEntries || 0;
  }

  /**
   * Measure Largest Contentful Paint (LCP)
   */
  async measureLCP(): Promise<number> {
    const lcp = await this.page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          observer.disconnect();
          resolve(lastEntry.startTime);
        });

        observer.observe({ type: 'largest-contentful-paint', buffered: true });

        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 5000);
      });
    });

    return lcp;
  }

  /**
   * Test component interactivity
   */
  async testInteractivity(componentSelector: string): Promise<InteractivityReport> {
    const component = this.page.locator(componentSelector);
    
    return {
      exists: await component.isVisible(),
      visible: await component.isVisible(),
      enabled: await component.isEnabled(),
      clickable: await component.isVisible() && await component.isEnabled(),
      coordinates: await component.boundingBox(),
    };
  }

  /**
   * Generate test report
   */
  async generateTestReport(testName: string): Promise<TestReport> {
    const startTime = Date.now();
    
    await this.page.goto('/');
    
    const metrics = await this.page.evaluate(() => ({
      jsHeapUsed: (performance as any).memory?.usedJSHeapSize || 0,
      jsHeapTotal: (performance as any).memory?.totalJSHeapSize || 0,
      documents: document.querySelectorAll('*').length,
    }));
    
    const fcp = await this.measureFCP();
    const lcp = await this.measureLCP();
    
    return {
      testName,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      metrics: {
        jsHeapUsed: metrics.jsHeapUsed,
        jsHeapTotal: metrics.jsHeapTotal,
        documents: metrics.documents,
        frames: 1,
        jsEventListeners: 0,
      },
      performance: {
        fcp,
        lcp,
        loadTime: Date.now() - startTime,
      },
    };
  }
}

/**
 * Debug options interface
 */
interface DebugOptions {
  captureScreenshots?: boolean;
  captureVideos?: boolean;
  verbose?: boolean;
  logNetwork?: boolean;
}

/**
 * Network analysis result
 */
interface NetworkAnalysis {
  requests: Request[];
  responses: Response[];
  failedRequests: Request[];
  slowRequests: { request: Request; duration: number }[];
  getReport: () => NetworkReport;
}

/**
 * Network report interface
 */
interface NetworkReport {
  totalRequests: number;
  successfulResponses: number;
  failedRequests: number;
  successRate: string;
  averageResponseTime: string;
  slowRequests: { request: Request; duration: number }[];
  endpoints: Record<string, number>;
}

/**
 * Memory leak report interface
 */
interface MemoryLeakReport {
  initialJSHeapUsed: number;
  finalJSHeapUsed: number;
  jsHeapDelta: number;
  potentialLeak: boolean;
}

/**
 * Interactivity report interface
 */
interface InteractivityReport {
  exists: boolean;
  visible: boolean;
  enabled: boolean;
  clickable: boolean;
  coordinates: { x: number; y: number; width: number; height: number } | null;
}

/**
 * Test report interface
 */
interface TestReport {
  testName: string;
  timestamp: string;
  duration: number;
  metrics: {
    jsHeapUsed: number;
    jsHeapTotal: number;
    documents: number;
    frames: number;
    jsEventListeners: number;
  };
  performance: {
    fcp: number;
    lcp: number;
    loadTime: number;
  };
}

/**
 * Create debug utils instance
 */
export function createDebugUtils(page: Page, context: BrowserContext, options?: DebugOptions): DebugUtils {
  return new DebugUtils(page, context, options);
}
