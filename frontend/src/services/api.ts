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
};

export default api;
