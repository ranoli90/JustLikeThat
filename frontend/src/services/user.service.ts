import api from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  jobTitle?: string;
  location?: string;
  remotePreference?: 'remote' | 'hybrid' | 'onsite';
  minSalary?: number;
  maxSalary?: number;
  jobType?: string;
  skills?: string[];
  preferredIndustries?: string[];
  preferredCompanySize?: string;
  noticePeriod?: number;
  availableFrom?: string;
  desiredRole?: string;
  yearsOfExperience?: number;
  educationLevel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesData {
  jobTitle?: string;
  location?: string;
  remoteWork?: boolean;
  minSalary?: number;
  maxSalary?: number;
  jobType?: string;
  skills?: string[];
}

export interface CandidateProfile {
  id: string;
  userId: string;
  about?: string;
  experience?: string;
  education?: string;
  skills?: string[];
  summary?: string;
  currentTitle?: string;
  currentCompany?: string;
  totalExperience?: number;
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  about?: string;
  experience?: string;
  education?: string;
  skills?: string[];
  summary?: string;
  currentTitle?: string;
  currentCompany?: string;
  totalExperience?: number;
  linkedinUrl?: string;
  portfolioUrl?: string;
}

class UserAPIService {
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response;
  }

  async updateProfile(data: UpdateUserData): Promise<User> {
    const response = await api.put<User>('/user/profile', data);
    return response;
  }

  async getPreferences(): Promise<UserPreferences> {
    const response = await api.get<UserPreferences>('/user/preferences');
    return response;
  }

  async updatePreferences(data: UpdatePreferencesData): Promise<UserPreferences> {
    const response = await api.put<UserPreferences>('/user/preferences', data);
    return response;
  }

  async deleteAccount(): Promise<void> {
    await api.delete('/user/account');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/user/password', { currentPassword, newPassword });
  }
}

class ProfileAPIService {
  async getCandidateProfile(): Promise<CandidateProfile> {
    const response = await api.get<CandidateProfile>('/profiles/me');
    return response;
  }

  async updateCandidateProfile(data: UpdateProfileData): Promise<CandidateProfile> {
    const response = await api.put<CandidateProfile>('/profiles/me', data);
    return response;
  }

  async uploadResume(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/profiles/resumes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response;
  }

  async deleteResume(): Promise<void> {
    await api.delete('/profiles/resumes');
  }
}

export const userAPI = new UserAPIService();
export const profileAPI = new ProfileAPIService();
export default { userAPI, profileAPI };
