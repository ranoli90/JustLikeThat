import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiService {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedRequests: Array<{ resolve: (token: string) => void; reject: (error: Error) => void }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (!this.isRefreshing) {
            this.isRefreshing = true;

            try {
              const refreshToken = localStorage.getItem('refresh_token');
              if (!refreshToken) {
                throw new Error('No refresh token');
              }

              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken,
              });

              const { accessToken } = response.data;
              localStorage.setItem('auth_token', accessToken);

              this.failedRequests.forEach((request) => request.resolve(accessToken));
              this.failedRequests = [];

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            } catch (refreshError) {
              this.failedRequests.forEach((request) =>
                request.reject(refreshError as Error)
              );
              this.failedRequests = [];

              localStorage.removeItem('auth_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
              return Promise.reject(refreshError);
            } finally {
              this.isRefreshing = false;
            }
          }

          return new Promise<string>((resolve, reject) => {
            this.failedRequests.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              },
              reject: (error: Error) => {
                reject(error);
              },
            });
          });
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      const message =
        (error.response.data as { message?: string })?.message ||
        error.message ||
        'An error occurred';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    }
    return error;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async signup(data: { email: string; password: string; name: string }) {
    const response = await this.client.post('/auth/signup', data);
    return response.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async updateProfile(data: Partial<{ name: string; email: string }>) {
    const response = await this.client.put('/user/profile', data);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.client.put('/user/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  async deleteAccount() {
    const response = await this.client.delete('/user/account');
    return response.data;
  }

  // User preferences
  async getPreferences() {
    const response = await this.client.get('/user/preferences');
    return response.data;
  }

  async updatePreferences(data: Record<string, unknown>) {
    const response = await this.client.put('/user/preferences', data);
    return response.data;
  }

  // Resume endpoints
  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await this.client.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getResumes() {
    const response = await this.client.get('/resume/list');
    return response.data;
  }

  async deleteResume(id: string) {
    const response = await this.client.delete(`/resume/${id}`);
    return response.data;
  }

  // Job endpoints
  async getJobs(params?: { page?: number; limit?: number; query?: string }) {
    const response = await this.client.get('/jobs', { params });
    return response.data;
  }

  async getJob(id: string) {
    const response = await this.client.get(`/jobs/${id}`);
    return response.data;
  }

  async searchJobs(query: string, filters?: Record<string, unknown>) {
    const response = await this.client.post('/jobs/search', { query, ...filters });
    return response.data;
  }

  // Application endpoints
  async getApplications(params?: { page?: number; state?: string }) {
    const response = await this.client.get('/applications', { params });
    return response.data;
  }

  async getApplication(id: string) {
    const response = await this.client.get(`/applications/${id}`);
    return response.data;
  }

  async createApplication(data: { jobPostingId: string; resumeId?: string }) {
    const response = await this.client.post('/applications', data);
    return response.data;
  }

  async updateApplication(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/applications/${id}`, data);
    return response.data;
  }

  async submitApplication(id: string) {
    const response = await this.client.post(`/applications/${id}/submit`);
    return response.data;
  }

  async withdrawApplication(id: string) {
    const response = await this.client.post(`/applications/${id}/withdraw`);
    return response.data;
  }

  // Matching endpoints
  async getMatches(personaId: string) {
    const response = await this.client.get(`/matching/jobs/${personaId}`);
    return response.data;
  }

  async getMatchScore(personaId: string, jobId: string) {
    const response = await this.client.get(`/matching/score/${personaId}/${jobId}`);
    return response.data;
  }

  // Tailoring endpoints
  async tailorResume(personaId: string, jobId: string, options?: Record<string, unknown>) {
    const response = await this.client.post('/tailoring/tailor', {
      personaId,
      jobPostingId: jobId,
      documentType: 'RESUME',
      ...options,
    });
    return response.data;
  }

  async tailorCoverLetter(personaId: string, jobId: string, options?: Record<string, unknown>) {
    const response = await this.client.post('/tailoring/tailor', {
      personaId,
      jobPostingId: jobId,
      documentType: 'COVER_LETTER',
      ...options,
    });
    return response.data;
  }

  // Interview endpoints
  async startInterview() {
    const response = await this.client.post('/interview/start');
    return response.data;
  }

  async submitInterviewAnswer(sessionId: string, questionId: string, answer: string) {
    const response = await this.client.post(`/interview/${sessionId}/answer`, {
      questionId,
      answer,
    });
    return response.data;
  }

  async completeInterview(sessionId: string) {
    const response = await this.client.post(`/interview/${sessionId}/complete`);
    return response.data;
  }

  async getInterviewResults(sessionId: string) {
    const response = await this.client.get(`/interview/${sessionId}/results`);
    return response.data;
  }

  // Intake endpoints
  async submitIntake(data: Record<string, unknown>) {
    const response = await this.client.post('/intake/submit', data);
    return response.data;
  }

  async getIntakeProgress() {
    const response = await this.client.get('/intake/progress');
    return response.data;
  }

  // Notification endpoints
  async getNotifications(params?: { page?: number; unreadOnly?: boolean }) {
    const response = await this.client.get('/notifications', { params });
    return response.data;
  }

  async markNotificationRead(id: string) {
    const response = await this.client.put(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.client.put('/notifications/read-all');
    return response.data;
  }

  async updateNotificationPreferences(data: Record<string, unknown>) {
    const response = await this.client.put('/notifications/preferences', data);
    return response.data;
  }

  // Generic request method with typed responses
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: Record<string, unknown>, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: Record<string, unknown>): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  async request<T>(config: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    data?: Record<string, unknown>;
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
  }): Promise<T> {
    const response = await this.client.request({
      ...config,
      headers: {
        ...config.headers,
      },
    });
    return response.data;
  }
}

export const api = new ApiService();
export default api;
