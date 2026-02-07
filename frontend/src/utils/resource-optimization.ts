/**
 * Resource Usage Optimization
 * Memory management and resource cleanup utilities
 */

// Memory pressure handler
export function registerMemoryPressureHandler(
  onPressure: (level: 'low' | 'medium' | 'high') => void
): () => void {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'memory') {
            const memory = entry as PerformanceEntry & { usedJSHeapSize: number; jsHeapSizeLimit: number };
            const used = memory.usedJSHeapSize;
            const limit = memory.jsHeapSizeLimit;
            const usage = used / limit;
            
            if (usage > 0.9) {
              onPressure('high');
            } else if (usage > 0.7) {
              onPressure('medium');
            } else {
              onPressure('low');
            }
          }
        }
      });
      
      observer.observe({ entryTypes: ['memory'] });
      
      return () => observer.disconnect();
    } catch (e) {
      // Memory PerformanceObserver not supported
    }
  }
  
  return () => {};
}

// Cleanup callbacks registry
const cleanupCallbacks: Set<() => void> = new Set();

export function registerCleanupCallback(callback: () => void): void {
  cleanupCallbacks.add(callback);
}

export function executeCleanup(): void {
  cleanupCallbacks.forEach(callback => {
    try {
      callback();
    } catch (e) {
      console.error('Cleanup callback error:', e);
    }
  });
}

// WeakRef map for automatic cleanup
export function createWeakRefMap<K extends object, V>() {
  const map = new WeakMap<K, V>();
  const refSet = new WeakSet<K>();
  
  return {
    set(key: K, value: V): void {
      map.set(key, value);
      refSet.add(key);
    },
    get(key: K): V | undefined {
      return map.get(key);
    },
    has(key: K): boolean {
      return map.has(key);
    },
    delete(key: K): void {
      map.delete(key);
      refSet.delete(key);
    },
    cleanup(): void {
      refSet.forEach(key => {
        if (!map.has(key)) {
          refSet.delete(key);
        }
      });
    },
  };
}

// Object pool for frequently created objects
export function createObjectPool<T>(
  factory: () => T,
  reset: (obj: T) => void,
  maxSize: number = 100
): {
  acquire: () => T;
  release: (obj: T) => void;
  clear: () => void;
} {
  const pool: T[] = [];
  
  return {
    acquire(): T {
      if (pool.length > 0) {
        const obj = pool.pop()!;
        return obj;
      }
      return factory();
    },
    release(obj: T): void {
      if (pool.length < maxSize) {
        reset(obj);
        pool.push(obj);
      }
    },
    clear(): void {
      pool.length = 0;
    },
  };
}

// Batch DOM reads/writes
export function createBatchProcessor<T>(
  process: (items: T[]) => void,
  options: { batchSize?: number; delay?: number } = {}
): {
  add: (item: T) => void;
  flush: () => void;
} {
  const { batchSize = 100, delay = 16 } = options;
  const queue: T[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    if (queue.length > 0) {
      const batch = queue.splice(0, batchSize);
      process(batch);
    }
    
    if (queue.length > 0) {
      timeoutId = setTimeout(flush, delay);
    }
  };
  
  return {
    add(item: T): void {
      queue.push(item);
      if (queue.length >= batchSize) {
        flush();
      } else if (!timeoutId) {
        timeoutId = setTimeout(flush, delay);
      }
    },
    flush,
  };
}

// Virtual scrolling helper
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  buffer?: number;
}

export function calculateVirtualScrollRange(
  scrollTop: number,
  options: VirtualScrollOptions
): { startIndex: number; endIndex: number; offsetY: number } {
  const { itemHeight, containerHeight, buffer = 5 } = options;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + buffer * 2, Infinity);
  
  return {
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight,
  };
}

// Image placeholder generator
export function createImagePlaceholder(
  width: number,
  height: number,
  color: string = '#f0f0f0'
): string {
  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : null;
  
  if (canvas) {
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      return canvas.toDataURL();
    }
  }
  
  return '';
}

// Audio/Video resource cleanup
export function cleanupMediaElement(
  element: HTMLMediaElement | null
): void {
  if (element) {
    element.pause();
    element.src = '';
    element.load();
    
    if (element instanceof HTMLVideoElement) {
      element.poster = '';
    }
    
    if ('srcObject' in element) {
      (element as HTMLMediaElement & { srcObject: unknown }).srcObject = null;
    }
    
    const parent = element.parentNode;
    if (parent) {
      parent.removeChild(element);
    }
  }
}

// WebSocket connection manager
export function createWebSocketManager<T = any>(
  url: string,
  options: {
    reconnectDelay?: number;
    maxRetries?: number;
    messageHandler?: (data: T) => void;
  } = {}
): {
  connect: () => void;
  disconnect: () => void;
  send: (data: unknown) => void;
  isConnected: () => boolean;
} {
  const { reconnectDelay = 3000, maxRetries = 5 } = options;
  let socket: WebSocket | null = null;
  let retries = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const messageQueue: unknown[] = [];
  
  const connect = () => {
    if (socket?.readyState === WebSocket.OPEN) return;
    
    try {
      socket = new WebSocket(url);
      
      socket.onopen = () => {
        retries = 0;
        while (messageQueue.length > 0) {
          socket?.send(messageQueue.shift());
        }
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          options.messageHandler?.(data);
        } catch (e) {
          // Not JSON
        }
      };
      
      socket.onclose = () => {
        if (retries < maxRetries) {
          retries += 1;
          reconnectTimer = setTimeout(connect, reconnectDelay * retries);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }
  };
  
  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket) {
      socket.close();
      socket = null;
    }
  };
  
  const send = (data: unknown) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    } else {
      messageQueue.push(data);
    }
  };
  
  const isConnected = () => socket?.readyState === WebSocket.OPEN;
  
  return { connect, disconnect, send, isConnected };
}

// Event listener cleanup helper
export function createEventListenerCleanup(): {
  add: <K extends keyof WindowEventMap>(
    type: K,
    listener: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions
  ) => void;
  addWindow: <K extends keyof WindowEventMap>(
    type: K,
    listener: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions
  ) => void;
  addDocument: <K extends keyof DocumentEventMap>(
    type: K,
    listener: (event: DocumentEventMap[K]) => void,
    options?: AddEventListenerOptions
  ) => void;
  cleanup: () => void;
} {
  const listeners: Array<{
    target: Window | Document;
    type: string;
    listener: EventListener;
    options: AddEventListenerOptions | undefined;
  }> = [];
  
  const addTarget = (
    target: Window | Document,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ) => {
    target.addEventListener(type, listener, options);
    listeners.push({ target, type, listener, options });
  };
  
  return {
    add: (type, listener, options) => {
      if (typeof window !== 'undefined') {
        addTarget(window, type, listener as EventListener, options);
      }
    },
    addWindow: (type, listener, options) => {
      if (typeof window !== 'undefined') {
        addTarget(window, type, listener as EventListener, options);
      }
    },
    addDocument: (type, listener, options) => {
      if (typeof document !== 'undefined') {
        addTarget(document, type, listener as EventListener, options);
      }
    },
    cleanup: () => {
      listeners.forEach(({ target, type, listener, options }) => {
        target.removeEventListener(type, listener, options);
      });
      listeners.length = 0;
    },
  };
}
