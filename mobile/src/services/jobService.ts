import apiClient from './api';

export interface JobSearchParams {
  query?: string;
  location?: string;
  type?: string;
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  limit?: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  matchScore: number;
  matchReasons: string[];
  postedAt: string;
  applyUrl: string;
  remote: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const jobService = {
  async search(params: JobSearchParams): Promise<PaginatedResponse<Job>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    return apiClient.get<PaginatedResponse<Job>>(`/jobs?${queryParams.toString()}`);
  },

  async getById(id: string): Promise<Job> {
    return apiClient.get<Job>(`/jobs/${id}`);
  },

  async saveJob(jobId: string): Promise<void> {
    return apiClient.post(`/jobs/${jobId}/save`);
  },

  async unsaveJob(jobId: string): Promise<void> {
    return apiClient.delete(`/jobs/${jobId}/save`);
  },

  async getSavedJobs(): Promise<Job[]> {
    return apiClient.get<Job[]>('/jobs/saved');
  },

  async getJobRecommendations(): Promise<Job[]> {
    return apiClient.get<Job[]>('/jobs/recommended');
  },

  async getRecentJobs(): Promise<Job[]> {
    return apiClient.get<Job[]>('/jobs/recent');
  },
};
