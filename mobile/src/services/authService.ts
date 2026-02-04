import apiClient from './api';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
}

export interface TokenRefreshResponse {
  token: string;
}

export const authService = {
  async login(params: LoginParams): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', { 
      body: params,
      requireAuth: false,
    });
  },

  async register(params: RegisterParams): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', { 
      body: params,
      requireAuth: false,
    });
  },

  async refreshToken(refreshToken: string): Promise<TokenRefreshResponse> {
    return apiClient.post<TokenRefreshResponse>('/auth/refresh', { 
      body: { refreshToken },
      requireAuth: false,
    });
  },

  async logout(): Promise<void> {
    return apiClient.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.put<User>('/auth/profile', { body: data });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiClient.post('/auth/change-password', {
      body: { currentPassword, newPassword },
    });
  },
};
