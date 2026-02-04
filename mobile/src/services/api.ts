import { getApiUrl } from '../config';
import { logger } from '../utils/logger';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiUrl('');
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, requireAuth = true } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (requireAuth && this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 401) {
        throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || 'Request failed',
          response.status,
          errorData.code || 'API_ERROR',
          errorData
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 0, 'TIMEOUT');
      }
      logger.error('API request failed', { endpoint, method, error });
      throw new ApiError('Network error', 0, 'NETWORK_ERROR');
    }
  }

  async get<T>(endpoint: string, options?: Omit<ApiOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, options?: Omit<ApiOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST' });
  }

  async put<T>(endpoint: string, options?: Omit<ApiOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT' });
  }

  async delete<T>(endpoint: string, options?: Omit<ApiOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
