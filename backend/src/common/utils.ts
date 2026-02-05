import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Formats a date to ISO string for analytics events
 */
export function formatIsoDate(date: Date): string {
  return date.toISOString();
}

/**
 * Generates a paginated response structure
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } } {
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Safely parses JSON with default value on failure
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * Masks sensitive data for logging
 */
export function maskSensitiveData(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) {
    return '***';
  }
  return `${value.substring(0, visibleChars)}***`;
}

/**
 * Throws an HTTP exception with standardized error format
 */
export function throwHttpException(
  message: string,
  status: HttpStatus,
  additionalInfo?: Record<string, unknown>,
): never {
  throw new HttpException(
    {
      message,
      ...additionalInfo,
    },
    status,
  );
}

/**
 * Sanitizes user input by removing potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
}

/**
 * Calculates the number of skip records for pagination
 */
export function calculateSkip(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * limit;
}

/**
 * Validates that a value is within acceptable range
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string,
): void {
  if (value < min || value > max) {
    throw new HttpException(
      `${fieldName} must be between ${min} and ${max}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Creates a shallow copy of an object excluding specified keys
 */
export function omitKeys<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

/**
 * Deep clones an object using JSON serialization as a safe fallback
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generates a unique share token for dashboards and resources
 */
export function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}