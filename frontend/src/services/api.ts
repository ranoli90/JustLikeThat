import axios from 'axios';
import { LoginData, SignupData, AuthResponse, User } from '../models/auth';
import { CandidateProfile, UpdateProfileData, UpdatePreferencesData, UserPreferences } from '../models/profile';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication API
export const authAPI = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },
  
  verifyEmail: async (email: string, code: string): Promise<{ success: boolean }> => {
    const response = await api.post('/auth/verify-email', { email, code });
    return response.data;
  },
  
  resendVerificationCode: async (email: string): Promise<{ success: boolean }> => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.patch('/users/profile', data);
    return response.data;
  },
  
  getPreferences: async (): Promise<UserPreferences> => {
    const response = await api.get('/users/preferences');
    return response.data;
  },
  
  updatePreferences: async (data: UpdatePreferencesData): Promise<UserPreferences> => {
    const response = await api.patch('/users/preferences', data);
    return response.data;
  },
};

// Profile API
export const profileAPI = {
  getCandidateProfile: async (): Promise<CandidateProfile> => {
    const response = await api.get('/profiles');
    return response.data;
  },
  
  updateCandidateProfile: async (data: UpdateProfileData): Promise<CandidateProfile> => {
    const response = await api.patch('/profiles', data);
    return response.data;
  },
  
  uploadResume: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/profiles/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getPersonas: async (): Promise<any[]> => {
    const response = await api.get('/profiles/personas');
    return response.data;
  },
  
  createPersona: async (data: any): Promise<any> => {
    const response = await api.post('/profiles/personas', data);
    return response.data;
  },
  
  updatePersona: async (id: number, data: any): Promise<any> => {
    const response = await api.patch(`/profiles/personas/${id}`, data);
    return response.data;
  },
  
  deletePersona: async (id: number): Promise<void> => {
    await api.delete(`/profiles/personas/${id}`);
  },
};

// Matching API
export const matchingAPI = {
  getJobMatches: async (): Promise<any[]> => {
    const response = await api.get('/matching/matches');
    return response.data;
  },
  
  getMatchDetails: async (matchId: number): Promise<any> => {
    const response = await api.get(`/matching/matches/${matchId}`);
    return response.data;
  },
  
  getMatchScores: async (): Promise<any[]> => {
    const response = await api.get('/matching/scores');
    return response.data;
  },
};

// Application API
export const applicationAPI = {
  getApplications: async (): Promise<any[]> => {
    const response = await api.get('/applications');
    return response.data;
  },
  
  getApplicationById: async (id: number): Promise<any> => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },
  
  createApplication: async (data: any): Promise<any> => {
    const response = await api.post('/applications', data);
    return response.data;
  },
  
  updateApplicationStatus: async (id: number, status: string): Promise<any> => {
    const response = await api.patch(`/applications/${id}`, { status });
    return response.data;
  },
  
  deleteApplication: async (id: number): Promise<void> => {
    await api.delete(`/applications/${id}`);
  },
};

// Automation API
export const automationAPI = {
  getAutomationConfig: async (): Promise<any> => {
    const response = await api.get('/automation/config');
    return response.data;
  },
  
  updateAutomationConfig: async (data: any): Promise<any> => {
    const response = await api.patch('/automation/config', data);
    return response.data;
  },
  
  getAutomationRules: async (): Promise<any[]> => {
    const response = await api.get('/automation/rules');
    return response.data;
  },
  
  createAutomationRule: async (data: any): Promise<any> => {
    const response = await api.post('/automation/rules', data);
    return response.data;
  },
  
  updateAutomationRule: async (id: number, data: any): Promise<any> => {
    const response = await api.patch(`/automation/rules/${id}`, data);
    return response.data;
  },
  
  deleteAutomationRule: async (id: number): Promise<void> => {
    await api.delete(`/automation/rules/${id}`);
  },
};

// Notification API
export const notificationAPI = {
  getNotificationSettings: async (): Promise<any> => {
    const response = await api.get('/notifications/settings');
    return response.data;
  },
  
  updateNotificationSettings: async (data: any): Promise<any> => {
    const response = await api.patch('/notifications/settings', data);
    return response.data;
  },
  
  getNotifications: async (): Promise<any[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },
  
  markNotificationRead: async (id: number): Promise<void> => {
    await api.patch(`/notifications/${id}`, { read: true });
  },
  
  deleteNotification: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};

// Security API
export const securityAPI = {
  getSecuritySettings: async (): Promise<any> => {
    const response = await api.get('/security/settings');
    return response.data;
  },
  
  updateSecuritySettings: async (data: any): Promise<any> => {
    const response = await api.patch('/security/settings', data);
    return response.data;
  },
  
  enableTwoFactorAuth: async (): Promise<any> => {
    const response = await api.post('/security/two-factor/enable');
    return response.data;
  },
  
  disableTwoFactorAuth: async (): Promise<any> => {
    const response = await api.post('/security/two-factor/disable');
    return response.data;
  },
  
  verifyTwoFactorCode: async (code: string): Promise<{ success: boolean }> => {
    const response = await api.post('/security/two-factor/verify', { code });
    return response.data;
  },
};

export default api;
