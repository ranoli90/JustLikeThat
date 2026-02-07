/**
 * Jest global type declarations
 * This file provides type definitions for Jest globals to resolve
 * "describe/it/expect/jest is not defined" errors in spec files.
 */

declare const describe: {
  (name: string, fn: () => void): void;
  skip: (name: string, fn: () => void) => void;
  only: (name: string, fn: () => void) => void;
  each: (cases: readonly unknown[], ...args: unknown[]) => void;
};

declare const it: {
  (name: string, fn: () => void | Promise<void>): void;
  skip: (name: string, fn: () => void | Promise<void>) => void;
  only: (name: string, fn: () => void | Promise<void>) => void;
  each: (cases: readonly unknown[], ...args: unknown[]) => void;
};

declare const test: typeof it;

declare const expect: {
  (actual: unknown): {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toContain(item: unknown): void;
    toThrow(error?: string | Error | RegExp): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledWith(...args: unknown[]): void;
    toHaveBeenCalledTimes(times: number): void;
    toBeGreaterThan(n: number): void;
    toBeLessThan(n: number): void;
    toBeGreaterThanOrEqual(n: number): void;
    toBeLessThanOrEqual(n: number): void;
    toMatch(pattern: string | RegExp): void;
    toMatchObject(expected: unknown): void;
    toStrictEqual(expected: unknown): void;
    any(constructor: new (...args: unknown[]) => unknown): unknown;
    not: ReturnType<typeof expect>;
    resolves: { toBe(expected: unknown): Promise<void>; toEqual(expected: unknown): Promise<void> };
    rejects: Promise<unknown>;
  };
  extend(matchers: Record<string, unknown>): void;
  any(constructor: new (...args: unknown[]) => unknown): unknown;
  all<T>(...expecteds: T[]): { asymmetricMatch(other: T): boolean };
};

declare const jest: {
  fn(): jest.Mock;
  fn<T, TArgs extends unknown[], TReturn>(
    implementation?: (...args: TArgs) => TReturn
  ): jest.Mock<T, TArgs>;
  mock(path: string, moduleFactory?: unknown): void;
  clearAllMocks(): void;
  resetAllMocks(): void;
  restoreAllMocks(): void;
  spyOn<T, K extends keyof T>(
    object: T,
    method: K,
    accessType?: 'get' | 'set'
  ): jest.SpyInstance<T[K]>;
  useFakeTimers(): void;
  useRealTimers(): void;
  advanceTimersByTime(ms: number): void;
  runAllTimers(): void;
  setTimeout(timeout: number): void;
  timeout: number;
};

declare const beforeAll: (fn: () => void | Promise<void>, timeout?: number) => void;
declare const afterAll: (fn: () => void | Promise<void>, timeout?: number) => void;
declare const beforeEach: (fn: () => void | Promise<void>, timeout?: number) => void;
declare const afterEach: (fn: () => void | Promise<void>, timeout?: number) => void;

// Jest object type for mocking
declare namespace jest {
  interface Mock<T = unknown, Args extends unknown[] = unknown[]> {
    (...args: Args): T;
    mock: { calls: Args[]; instances: unknown[] };
    mockReturnValue(value: T): Mock<T, Args>;
    mockReturnValueOnce(value: T): Mock<T, Args>;
    mockResolvedValue(value: T | PromiseLike<T>): Mock<T, Args>;
    mockResolvedValueOnce(value: T | PromiseLike<T>): Mock<T, Args>;
    mockRejectedValue(value: T | PromiseLike<T>): Mock<T, Args>;
    mockRejectedValueOnce(value: T | PromiseLike<T>): Mock<T, Args>;
    mockImplementation(fn: (...args: Args) => T): Mock<T, Args>;
    mockImplementationOnce(fn: (...args: Args) => T): Mock<T, Args>;
    mockName(name: string): Mock<T, Args>;
  }

  type SpyInstance<TArgs extends unknown[] = unknown[], TReturn = unknown> = {
    (...args: TArgs): TReturn;
    mock: { calls: TArgs[]; instances: unknown[] };
    mockClear(): void;
    mockRestore(): void;
    mockReturnValue(value: TReturn): SpyInstance<TArgs, TReturn>;
    mockResolvedValue(value: TReturn): SpyInstance<TArgs, Promise<TReturn>>;
    mockRejectedValue(value: unknown): SpyInstance<TArgs, Promise<never>>;
    mockImplementation(fn: (...args: TArgs) => TReturn): SpyInstance<TArgs, TReturn>;
  };
}

// Export dummy object to make this a valid ES module
export {};
