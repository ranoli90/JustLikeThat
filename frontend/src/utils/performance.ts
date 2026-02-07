/**
 * Frontend Performance Utilities
 * Optimizations for client-side performance
 */

// Extended interfaces for browser APIs
interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: string;
    downlink?: number;
  };
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

// Memoization utility
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxSize: number = 100
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  });
}

// Debounce utility with leading/trailing options
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  const { leading = false, trailing = true } = options;
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    lastArgs = args;
    
    if (leading) {
      const shouldCall = timeoutId === null;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (trailing && lastArgs !== null) {
          fn(...lastArgs);
        }
        lastArgs = null;
      }, delay);
      
      if (shouldCall) {
        fn(...args);
      }
    } else {
      timeoutId = setTimeout(() => {
        if (lastArgs !== null) {
          fn(...lastArgs);
        }
        timeoutId = null;
        lastArgs = null;
      }, delay);
    }
  });
}

// Throttle utility
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): T {
  let inThrottle = false;
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  });
}

// Request idle callback polyfill
export function requestIdleCallback(
  callback: (deadline: IdleDeadline) => void,
  options?: { timeout?: number }
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  const startTime = Date.now();
  const timeout = options?.timeout || 50;
  
  return window.setTimeout(() => {
    callback({
      didTimeout: Date.now() - startTime > timeout,
      timeRemaining: () => Math.max(0, timeout - (Date.now() - startTime)),
    });
  }, 1);
}

// Batch DOM operations
export function batchDOMOperations(operations: () => void): void {
  if (typeof document !== 'undefined') {
    const observer = new MutationObserver(() => {
      // Batch completed
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    operations();
    
    requestIdleCallback(() => {
      observer.disconnect();
    });
  } else {
    operations();
  }
}

// Image lazy loading with Intersection Observer
export function createLazyImageLoader(
  options: IntersectionObserverInit = {}
): {
  observe: (element: HTMLImageElement) => void;
  unobserve: (element: HTMLImageElement) => void;
} {
  if (typeof IntersectionObserver === 'undefined') {
    return {
      observe: (element) => element.loading = 'lazy',
      unobserve: () => {},
    };
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.target instanceof HTMLImageElement) {
        const img = entry.target;
        img.src = img.dataset.src || '';
        img.removeAttribute('data-src');
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  }, options);
  
  return {
    observe: (element) => {
      if (element.dataset.src) {
        observer.observe(element);
      }
    },
    unobserve: (element) => observer.unobserve(element),
  };
}

// Resource hint utilities
export function addResourceHint(
  hint: 'preconnect' | 'dns-prefetch' | 'preload' | 'prefetch' | 'prerender',
  href: string,
  as?: string
): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = hint;
  link.href = href;
  
  if (as) {
    link.setAttribute('as', as);
  }
  
  document.head.appendChild(link);
}

// Preload critical resources
export function preloadCriticalResources(resources: Array<{ href: string; type: string }>): void {
  resources.forEach(({ href, type }) => {
    if (type === 'script') {
      addResourceHint('preload', href, 'script');
    } else if (type === 'style') {
      addResourceHint('preload', href, 'style');
    } else if (type === 'font') {
      addResourceHint('preload', href, 'font');
      const urlParts = href.split('/');
      addResourceHint('preconnect', `${urlParts[0]}//${urlParts[2]}`);
    }
  });
}

// Performance monitoring
export function measureComponentRender(
  componentName: string,
  renderFn: () => void
): void {
  if (typeof window === 'undefined' || !window.performance) return;
  
  const startMark = `${componentName}_render_start`;
  const endMark = `${componentName}_render_end`;
  
  performance.mark(startMark);
  renderFn();
  performance.mark(endMark);
  
  performance.measure(
    `${componentName}_render`,
    startMark,
    endMark
  );
}

// Long task detection
export function detectLongTasks(
  callback: (longTask: PerformanceLongTaskTiming) => void,
  threshold: number = 50
): void {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'longtask' && entry.duration > threshold) {
          callback(entry as PerformanceLongTaskTiming);
        }
      });
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // Long Tasks API not supported
  }
}

// Network quality detection
export function getNetworkQuality(): 'slow-2g' | '2g' | '3g' | '4g' | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown';
  
  const {connection} = navigator as NavigatorWithConnection;
  
  if (!connection) return 'unknown';
  
  const { effectiveType, downlink } = connection;
  const linkSpeed = downlink ?? 0;
  
  if (effectiveType === '4g' || linkSpeed > 10) return '4g';
  if (effectiveType === '3g' || linkSpeed > 1) return '3g';
  if (effectiveType === '2g') return '2g';
  if (effectiveType === 'slow-2g') return 'slow-2g';
  
  return 'unknown';
}

// Memory usage monitoring
export function getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null {
  if (typeof window === 'undefined' || !(performance as PerformanceWithMemory).memory) return null;
  
  const {memory} = performance as PerformanceWithMemory;
  if (!memory) return null;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
  };
}

// Web Vitals measurement
export function measureWebVitals(
  onReport: (metric: { name: string; value: number; delta: number; entries: PerformanceEntry[] }) => void
): void {
  if (typeof window === 'undefined') return;
  
  // LCP
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries.at(-1);
        if (!lastEntry) return;
        onReport({
          name: 'LCP',
          value: lastEntry.startTime + lastEntry.duration,
          delta: lastEntry.startTime,
          entries: [lastEntry],
        });
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // LCP not supported
    }
    
    // FID
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const firstInput = list.getEntries().at(0);
        if (firstInput) {
          onReport({
            name: 'FID',
            value: firstInput.processingStart - firstInput.startTime,
            delta: firstInput.processingStart - firstInput.startTime,
            entries: [firstInput],
          });
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      // FID not supported
    }
    
    // CLS
    let clsValue = 0;
    const clsEntries: PerformanceEntry[] = [];
    try {
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value || 0;
            clsEntries.push(entry);
          }
        });
        onReport({
          name: 'CLS',
          value: clsValue,
          delta: clsValue,
          entries: clsEntries,
        });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // CLS not supported
    }
  }
}

// Bundle size monitoring
export function monitorBundleSize(): void {
  if (typeof window === 'undefined' || !window.performance) return;
  
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const bundleStats = resources
    .filter(r => r.name.includes('.js') || r.name.includes('.css'))
    .reduce(
      (acc, r) => {
        const type = r.name.includes('.js') ? 'scripts' : 'styles';
        acc[type].count += 1;
        acc[type].size += r.transferSize || r.decodedBodySize || 0;
        return acc;
      },
      { scripts: { count: 0, size: 0 }, styles: { count: 0, size: 0 } }
    );
  
  // Bundle statistics available for consumers via return value if needed
}
