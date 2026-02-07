/**
 * Jest Setup File for Mobile
 * 
 * This file provides type declarations for Jest globals to resolve
 * "describe/it/expect/jest is not defined" errors in spec files.
 * 
 * Add this file to your Jest configuration via setupFilesAfterEnv:
 * setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
 */

// Jest Global Type Declarations
declare const describe: {
  (name: string, fn: () => void): void;
  skip: (name: string, fn: () => void) => void;
  only: (name: string, fn: () => void) => void;
  each: (table: any[], ...args: any[]) => (name: string, fn: (...args: any[]) => void) => void;
};

declare const it: {
  (name: string, fn: () => Promise<void> | void): void;
  skip: (name: string, fn: () => Promise<void> | void) => void;
  only: (name: string, fn: () => Promise<void> | void) => void;
  each: (table: any[], ...args: any[]) => (name: string, fn: (...args: any[]) => Promise<void> | void) => void;
};

declare const test: {
  (name: string, fn: () => Promise<void> | void): void;
  skip: (name: string, fn: () => Promise<void> | void) => void;
  only: (name: string, fn: () => Promise<void> | void) => void;
  each: (table: any[], ...args: any[]) => (name: string, fn: (...args: any[]) => Promise<void> | void) => void;
};

declare const expect: {
  <T>(actual: T): Expect<T>;
  any(expectedConstructor: new (...args: any[]) => unknown): any;
  anything(): any;
  arrayContaining(expected: unknown[]): unknown;
  objectContaining(expected: Record<string, unknown>): unknown;
  stringContaining(expected: string): unknown;
  stringMatching(expected: string | RegExp): unknown;
  addSnapshotSerializer(serializer: unknown): void;
};

interface Expect<T> {
  toBe(expected: T): void;
  toEqual(expected: T): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeDefined(): void;
  toBeNaN(): void;
  toContain(item: unknown): void;
  toThrow(error?: string | Error | RegExp): void;
  toThrowError(error?: string | Error | RegExp): void;
  toHaveLength(expected: number): void;
  toMatch(expected: string | RegExp): void;
  toMatchObject(expected: Record<string, unknown>): void;
  toStrictEqual(expected: T): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toBeCloseTo(expected: number, numDigits?: number): void;
  toContainEqual(item: unknown): void;
  toHaveProperty(keyPath: string | string[], value?: unknown): void;
  toBeInstanceOf(expected: new (...args: any[]) => unknown): void;
  not: Expect<T>;
}

declare const jest: {
  (): JestMock;
  fn<T = unknown, Args extends unknown[] = any[]>(): Mock<T, Args>;
  mock(path: string, factory?: () => unknown, options?: Record<string, unknown>): typeof jest;
  unmock(path: string): typeof jest;
  doMock(path: string, factory?: () => unknown, options?: Record<string, unknown>): typeof jest;
  dontMock(path: string): typeof jest;
  setTimeout(timeout: number): typeof jest;
  clearAllTimers(): void;
  advanceTimersByTime(ms: number): void;
  runAllTimers(): void;
  useFakeTimers(): void;
  useRealTimers(): void;
  spyOn(object: Record<string, unknown>, method: string): SpyInstance;
  stub(object: Record<string, unknown>, method: string): SpyInstance;
  restoreAllMocks(): void;
  resetAllMocks(): void;
  clearAllMocks(): void;
  resetModules(): void;
  isolateModules(fn: () => void): void;
  requireActual(moduleName: string): unknown;
  requireMock(moduleName: string): unknown;
  setSystemTime(time: number | Date): void;
  getRealSystemTime(): number;
};

interface Mock<T = unknown, Args extends unknown[] = any[]> {
  (...args: Args): T;
  mock: {
    calls: Args[];
    instances: unknown[];
    contexts: unknown[];
    results: { type: 'return' | 'throw' | 'incomplete'; value: T | undefined }[];
  };
  mockClear(): Mock<T, Args>;
  mockReset(): Mock<T, Args>;
  mockRestore(): void;
  mockImplementation(fn: (...args: Args) => T): Mock<T, Args>;
  mockImplementationOnce(fn: (...args: Args) => T): Mock<T, Args>;
  mockName(name: string): Mock<T, Args>;
  getMockName(): string;
}

interface JestMock extends Mock {
  fn<T = unknown, Args extends unknown[] = any[]>(): Mock<T, Args>;
}

interface SpyInstance<T = unknown, Args extends unknown[] = any[]> {
  (...args: Args): T;
  mockRestore(): void;
  mockClear(): SpyInstance<T, Args>;
  mockReset(): SpyInstance<T, Args>;
  mockImplementation(fn: (...args: Args) => T): SpyInstance<T, Args>;
  mockImplementationOnce(fn: (...args: Args) => T): SpyInstance<T, Args>;
  mockReturnValue(value: T): SpyInstance<T, Args>;
  mockReturnValueOnce(value: T): SpyInstance<T, Args>;
  mockResolvedValue(value: T): SpyInstance<T, Args>;
  mockResolvedValueOnce(value: T): SpyInstance<T, Args>;
  mockRejectedValue(value: unknown): SpyInstance<T, Args>;
  mockRejectedValueOnce(value: unknown): SpyInstance<T, Args>;
  getMockName(): string;
  mockName(name: string): SpyInstance<T, Args>;
}

declare const beforeAll: {
  (fn: () => Promise<void> | void, timeout?: number): void;
};

declare const afterAll: {
  (fn: () => Promise<void> | void, timeout?: number): void;
};

declare const beforeEach: {
  (fn: () => Promise<void> | void, timeout?: number): void;
};

declare const afterEach: {
  (fn: () => Promise<void> | void, timeout?: number): void;
};

// Additional Jest Variants
declare const xdescribe: {
  (name: string, fn: () => void): void;
};

declare const xit: {
  (name: string, fn: () => Promise<void> | void): void;
};

declare const xtest: {
  (name: string, fn: () => Promise<void> | void): void;
};

declare const fdescribe: {
  (name: string, fn: () => void): void;
};

declare const fit: {
  (name: string, fn: () => Promise<void> | void): void;
};

declare const ftest: {
  (name: string, fn: () => Promise<void> | void): void;
};
