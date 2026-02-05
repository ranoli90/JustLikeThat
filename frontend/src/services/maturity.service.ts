// Maturity Service - Frontend API client
// Sprint 50: Platform Maturity & Handover

const API_BASE = '/api/v1/maturity';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

// Documentation API
export const DocumentationAPI = {
  getAll: (params?: { page?: number; limit?: number; category?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return fetchApi<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/documentation?${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/documentation/${id}`),
  create: (data: any) => fetchApi<any>('/documentation', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi<any>(`/documentation/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<any>(`/documentation/${id}`, { method: 'DELETE' }),
  publish: (id: string) => fetchApi<any>(`/documentation/${id}/publish`, { method: 'POST' }),
  submitForReview: (id: string) => fetchApi<any>(`/documentation/${id}/submit-review`, { method: 'POST' }),
  markHelpful: (id: string) => fetchApi<any>(`/documentation/${id}/helpful`, { method: 'POST' }),
  getStats: () => fetchApi<any>('/documentation/stats'),
  getByCategory: (category: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return fetchApi<{ data: any[]; total: number }>(`/documentation/category/${category}?${query}`);
  },
};

// Training API
export const TrainingAPI = {
  getAll: (params?: { page?: number; limit?: number; type?: string; category?: string; difficulty?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.type) query.set('type', params.type);
    if (params?.category) query.set('category', params.category);
    if (params?.difficulty) query.set('difficulty', params.difficulty);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return fetchApi<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/training?${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/training/${id}`),
  create: (data: any) => fetchApi<any>('/training', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi<any>(`/training/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<any>(`/training/${id}`, { method: 'DELETE' }),
  publish: (id: string) => fetchApi<any>(`/training/${id}/publish`, { method: 'POST' }),
  getProgress: (userId: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return fetchApi<{ data: any[]; total: number }>(`/training/progress/${userId}?${query}`);
  },
  updateProgress: (id: string, data: { userId: string; progress: number; timeSpent?: number; status?: string; completedAt?: string }) =>
    fetchApi<any>(`/training/${id}/progress`, { method: 'PUT', body: JSON.stringify(data) }),
  getStats: () => fetchApi<any>('/training/stats'),
};

// Runbook API
export const RunbookAPI = {
  getAll: (params?: { page?: number; limit?: number; category?: string; status?: string; priority?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.search) query.set('search', params.search);
    return fetchApi<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/runbooks?${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/runbooks/${id}`),
  create: (data: any) => fetchApi<any>('/runbooks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi<any>(`/runbooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<any>(`/runbooks/${id}`, { method: 'DELETE' }),
  execute: (id: string, data: { executedBy: string; notes?: string }) =>
    fetchApi<any>(`/runbooks/${id}/execute`, { method: 'POST', body: JSON.stringify(data) }),
  publish: (id: string) => fetchApi<any>(`/runbooks/${id}/publish`, { method: 'POST' }),
  archive: (id: string) => fetchApi<any>(`/runbooks/${id}/archive`, { method: 'POST' }),
  getExecutionHistory: (id: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return fetchApi<{ data: any[]; total: number }>(`/runbooks/${id}/executions?${query}`);
  },
  getUserExecutions: (userId: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return fetchApi<{ data: any[]; total: number }>(`/runbooks/user/${userId}/executions?${query}`);
  },
  getStats: () => fetchApi<any>('/runbooks/stats'),
};

// Release API
export const ReleaseAPI = {
  getAll: (params?: { page?: number; limit?: number; status?: string; riskLevel?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.status) query.set('status', params.status);
    if (params?.riskLevel) query.set('riskLevel', params.riskLevel);
    if (params?.search) query.set('search', params.search);
    return fetchApi<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/releases?${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/releases/${id}`),
  create: (data: any) => fetchApi<any>('/releases', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi<any>(`/releases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<any>(`/releases/${id}`, { method: 'DELETE' }),
  approve: (id: string, data: { approverRole: string; approverId: string; comments?: string }) =>
    fetchApi<any>(`/releases/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  deploy: (id: string, data: { environment: string; deployedBy: string }) =>
    fetchApi<any>(`/releases/${id}/deploy`, { method: 'POST', body: JSON.stringify(data) }),
  rollback: (id: string, data: { reason: string; rolledBackBy: string }) =>
    fetchApi<any>(`/releases/${id}/rollback`, { method: 'POST', body: JSON.stringify(data) }),
  release: (id: string) => fetchApi<any>(`/releases/${id}/release`, { method: 'POST' }),
  getStats: () => fetchApi<any>('/releases/stats'),
};

// QA API
export const QAAPI = {
  getReports: (params?: { page?: number; limit?: number; releaseId?: string; testType?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.releaseId) query.set('releaseId', params.releaseId);
    if (params?.testType) query.set('testType', params.testType);
    if (params?.status) query.set('status', params.status);
    return fetchApi<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/qa/reports?${query}`);
  },
  getReportById: (id: string) => fetchApi<any>(`/qa/reports/${id}`),
  createReport: (data: any) => fetchApi<any>('/qa/reports', { method: 'POST', body: JSON.stringify(data) }),
  updateReportStatus: (id: string, data: { status: string; resolvedIssues?: any[] }) =>
    fetchApi<any>(`/qa/reports/${id}/update`, { method: 'POST', body: JSON.stringify(data) }),
  executeTests: (data: { suiteId: string; environment: string }) =>
    fetchApi<any>('/qa/execute', { method: 'POST', body: JSON.stringify(data) }),
  getLatestReport: (releaseId: string, testType: string) =>
    fetchApi<any>(`/qa/reports/latest/${releaseId}/${testType}`),
  getStats: () => fetchApi<any>('/qa/reports/stats'),
};

// Sign-off API
export const SignOffAPI = {
  getAll: (params?: { page?: number; limit?: number; stakeholderType?: string; area?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.stakeholderType) query.set('stakeholderType', params.stakeholderType);
    if (params?.area) query.set('area', params.area);
    if (params?.status) query.set('status', params.status);
    return fetchApi<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/signoffs?${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/signoffs/${id}`),
  create: (data: any) => fetchApi<any>('/signoffs', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id: string, data: { comments?: string; evidence?: any }) =>
    fetchApi<any>(`/signoffs/${id}/approve`, { method: 'PUT', body: JSON.stringify(data) }),
  reject: (id: string, data: { comments?: string }) =>
    fetchApi<any>(`/signoffs/${id}/reject`, { method: 'PUT', body: JSON.stringify(data) }),
  requestRevision: (id: string, data: { comments: string }) =>
    fetchApi<any>(`/signoffs/${id}/request-revision`, { method: 'PUT', body: JSON.stringify(data) }),
  getStats: () => fetchApi<any>('/signoffs/stats'),
  getOverallStatus: () => fetchApi<any>('/signoffs/overall'),
};

// Metrics API
export const MetricsAPI = {
  getAll: (limit?: number) => fetchApi<any[]>(`/metrics${limit ? `?limit=${limit}` : ''}`),
  getLatest: () => fetchApi<any>('/metrics/latest'),
  getOverall: () => fetchApi<any>('/metrics/overall'),
  getHealthStatus: () => fetchApi<any>('/metrics/health'),
  create: (data: any) => fetchApi<any>('/metrics', { method: 'POST', body: JSON.stringify(data) }),
};

// FAQ API
export const FAQAPI = {
  getAll: (params?: { page?: number; limit?: number; category?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return fetchApi<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/faq?${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/faq/${id}`),
  create: (data: any) => fetchApi<any>('/faq', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi<any>(`/faq/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<any>(`/faq/${id}`, { method: 'DELETE' }),
  search: (query: string, limit?: number) =>
    fetchApi<any[]>(`/faq/search?q=${encodeURIComponent(query)}${limit ? `&limit=${limit}` : ''}`),
  markHelpful: (id: string) => fetchApi<any>(`/faq/${id}/helpful`, { method: 'POST' }),
  markNotHelpful: (id: string) => fetchApi<any>(`/faq/${id}/not-helpful`, { method: 'POST' }),
  publish: (id: string) => fetchApi<any>(`/faq/${id}/publish`, { method: 'POST' }),
  archive: (id: string) => fetchApi<any>(`/faq/${id}/archive`, { method: 'POST' }),
  getStats: () => fetchApi<any>('/faq/stats'),
  getCategories: () => fetchApi<string[]>('/faq/categories'),
};

// Knowledge Transfer API
export const KnowledgeTransferAPI = {
  getAll: (params?: { page?: number; limit?: number; type?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return fetchApi<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/knowledge-transfer?${query}`);
  },
  getById: (id: string) => fetchApi<any>(`/knowledge-transfer/${id}`),
  create: (data: any) => fetchApi<any>('/knowledge-transfer', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi<any>(`/knowledge-transfer/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<any>(`/knowledge-transfer/${id}`, { method: 'DELETE' }),
  schedule: (id: string, schedule: Record<string, unknown>) =>
    fetchApi<any>(`/knowledge-transfer/${id}/schedule`, { method: 'POST', body: JSON.stringify({ schedule }) }),
  complete: (id: string) => fetchApi<any>(`/knowledge-transfer/${id}/complete`, { method: 'POST' }),
  cancel: (id: string) => fetchApi<any>(`/knowledge-transfer/${id}/cancel`, { method: 'POST' }),
  getStats: () => fetchApi<any>('/knowledge-transfer/stats'),
  getUpcoming: (limit?: number) =>
    fetchApi<any[]>(`/knowledge-transfer/upcoming${limit ? `?limit=${limit}` : ''}`),
};

// Export all APIs
export default {
  Documentation: DocumentationAPI,
  Training: TrainingAPI,
  Runbook: RunbookAPI,
  Release: ReleaseAPI,
  QA: QAAPI,
  SignOff: SignOffAPI,
  Metrics: MetricsAPI,
  FAQ: FAQAPI,
  KnowledgeTransfer: KnowledgeTransferAPI,
};
