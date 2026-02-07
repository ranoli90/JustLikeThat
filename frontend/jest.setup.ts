/**
 * Jest globals type declarations
 * This file provides type definitions for Jest globals to resolve
 * "describe/it/expect/jest is not defined" errors in spec files.
 */

// Global test functions
declare const describe: {
  (name: string, fn: () => void): void;
  skip: (name: string, fn: () => void) => void;
  only: (name: string, fn: () => void) => void;
  each: (cases: readonly (readonly any[])[]) => (
    name: string,
    fn: (...args: any[]) => void
  ) => void;
};

declare const it: {
  (name: string, fn: () => Promise<void> | void): void;
  skip: (name: string, fn: () => Promise<void> | void) => void;
  only: (name: string, fn: () => Promise<void> | void) => void;
  each: (cases: readonly (readonly any[])[]) => (
    name: string,
    fn: (...args: any[]) => Promise<void> | void
  ) => void;
};

declare const test: {
  (name: string, fn: () => Promise<void> | void): void;
  skip: (name: string, fn: () => Promise<void> | void) => void;
  only: (name: string, fn: () => Promise<void> | void) => void;
  each: (cases: readonly (readonly any[])[]) => (
    name: string,
    fn: (...args: any[]) => Promise<void> | void
  ) => void;
};

// Aliases for it
declare const xit: {
  (name: string, fn: () => Promise<void> | void) => void;
};

declare const xtest: {
  (name: string, fn: () => Promise<void> | void) => void;
};

declare const fit: {
  (name: string, fn: () => Promise<void> | void) => void;
};

// Aliases for describe
declare const xdescribe: {
  (name: string, fn: () => void) => void;
};

declare const fdescribe: {
  (name: string, fn: () => void) => void;
};

// Expect assertion
declare const expect: {
  (actual: any): {
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toContain(item: any): void;
    toThrow(error?: string | Error | RegExp): void;
    toThrowError(error?: string | Error | RegExp): void;
    not: {
      toBe(expected: any): void;
      toEqual(expected: any): void;
      toBeNull(): void;
      toBeUndefined(): void;
      toBeDefined(): void;
      toBeTruthy(): void;
      toBeFalsy(): void;
      toContain(item: any): void;
      toThrow(error?: string | Error | RegExp): void;
    };
    resolves: Promise<{ then: (onfulfilled?: (value: any) => any) => any }>;
    rejects: Promise<{ then: (onrejected?: (reason: any) => any) => any }>;
  };
};

// Jest object / global test utilities
declare const jest: {
  (): jest.Mock;
  mock(moduleName: string, factory?: () => any, options?: { virtual?: boolean }): typeof jest;
  unmock(moduleName: string): typeof jest;
  doMock(moduleName: string, factory?: () => any, options?: { virtual?: boolean }): typeof jest;
  dontMock(moduleName: string): typeof jest;
  clearAllMocks(): typeof jest;
  resetAllMocks(): typeof jest;
  restoreAllMocks(): typeof jest;
  fn(): jest.Mock;
  spyOn(object: any, methodName: string): any;
  clearAllTimers(): void;
  setTimeout(timeout: number): void;
  useFakeTimers(): typeof jest;
  useRealTimers(): typeof jest;
  advanceTimersByTime(msToRun: number): void;
  runOnlyPendingTimers(): void;
  runTimersToTime(msToRun: number): void;
};

declare namespace jest {
  interface Mock<T = (...args: any[]) => any> {
    (...args: any[]): T;
    mock: {
      calls: any[][];
      instances: any[];
      invocationCallOrder: number[];
    };
    mockClear(): Mock<T>;
    mockRestore(): void;
    mockImplementation(fn: (...args: any[]) => T): Mock<T>;
    mockImplementationOnce(fn: (...args: any[]) => T): Mock<T>;
    mockName(name: string): Mock<T>;
    mockReturnThis(): Mock<T>;
    mockReturnValue(value: T): Mock<T>;
    mockReturnValueOnce(value: T): Mock<T>;
    getMockName(): string;
  }

  interface Matchers<T> {
    toBe(expected: T): void;
    toEqual(expected: T): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toBeCloseTo(expected: number, numDigits?: number): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toContain(item: any): void;
    toContainEqual(item: any): void;
    toThrow(error?: string | Error | RegExp): void;
    toThrowError(error?: string | Error | RegExp): void;
    toHaveLength(length: number): void;
    toHaveProperty(keyPath: string | string[], value?: any): void;
    toMatch(regexpOrString: RegExp | string): void;
    toMatchObject(object: object): void;
    toStrictEqual(object: object): void;
    toBeInstanceOf(expected: any): void;
    any(expected: any): any;
  }
}

// Lifecycle hooks
declare const beforeAll: (fn: () => Promise<void> | void, timeout?: number) => void;
declare const afterAll: (fn: () => Promise<void> | void, timeout?: number) => void;
declare const beforeEach: (fn: () => Promise<void> | void, timeout?: number) => void;
declare const afterEach: (fn: () => Promise<void> | void, timeout?: number) => void;
