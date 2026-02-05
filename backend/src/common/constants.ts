/**
 * @file Common constants used across the application
 * Replaces magic numbers with named constants for better code maintainability
 */

/** Time constants in milliseconds */
export const TimeConstants = {
  /** 1 hour in milliseconds */
  ONE_HOUR_MS: 60 * 60 * 1000,
  /** 24 hours in milliseconds */
  TWENTY_FOUR_HOURS_MS: 24 * 60 * 60 * 1000,
  /** 7 days in milliseconds */
  SEVEN_DAYS_MS: 7 * 24 * 60 * 60 * 1000,
  /** 1 second in milliseconds */
  ONE_SECOND_MS: 1000,
  /** Buffer flush interval in milliseconds */
  BUFFER_FLUSH_INTERVAL_MS: 1000,
} as const;

/** Authentication constants */
export const AuthConstants = {
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,
  /** Bcrypt salt rounds for password hashing */
  BCRYPT_SALT_ROUNDS: 10,
  /** Access token expiration time */
  ACCESS_TOKEN_EXPIRY: '24h',
  /** Refresh token expiration time */
  REFRESH_TOKEN_EXPIRY: '7d',
} as const;

/** Rate limiting constants */
export const RateLimitConstants = {
  /** Maximum events in buffer before flush */
  BUFFER_MAX_SIZE: 100,
  /** Default rate limit request count */
  DEFAULT_RATE_LIMIT: 100,
} as const;

/** HTTP status codes */
export const HttpStatusConstants = {
  /** Success status */
  SUCCESS: 200,
  /** Created status */
  CREATED: 201,
  /** Bad request status */
  BAD_REQUEST: 400,
  /** Unauthorized status */
  UNAUTHORIZED: 401,
  /** Not found status */
  NOT_FOUND: 404,
  /** Internal server error status */
  INTERNAL_SERVER_ERROR: 500,
  /** Service unavailable status */
  SERVICE_UNAVAILABLE: 503,
  /** Too many requests status */
  TOO_MANY_REQUESTS: 429,
} as const;