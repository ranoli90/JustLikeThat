const API_BASE = '/api/security';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Dashboard
export const getSecurityDashboard = async (): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/dashboard`);
  return response.json();
};

// Threats
export const getThreats = async (status?: string): Promise<ApiResponse<unknown[]>> => {
  const url = status ? `${API_BASE}/threats?status=${status}` : `${API_BASE}/threats`;
  const response = await fetch(url);
  return response.json();
};

export const mitigateThreat = async (threatId: string): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/threats/${threatId}/mitigate`, {
    method: 'POST',
  });
  return response.json();
};

// Encryption
export const getEncryptionStatus = async (): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/encryption/status`);
  return response.json();
};

export const rotateEncryptionKey = async (): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/encryption/rotate-key`, {
    method: 'POST',
  });
  return response.json();
};

// Audit
export const getAuditLogs = async (params?: {
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}): Promise<any> => {
  const searchParams = new URLSearchParams();
  if (params?.userId) searchParams.append('userId', params.userId);
  if (params?.action) searchParams.append('action', params.action);
  if (params?.startDate) searchParams.append('startDate', params.startDate);
  if (params?.endDate) searchParams.append('endDate', params.endDate);

  const url = searchParams.toString()
    ? `${API_BASE}/audit/logs?${searchParams.toString()}`
    : `${API_BASE}/audit/logs`;

  const response = await fetch(url);
  return response.json();
};

export const exportAuditLogs = async (startDate: string, endDate: string): Promise<ApiResponse<unknown>> => {
  const response = await fetch(
    `${API_BASE}/audit/export?startDate=${startDate}&endDate=${endDate}`,
  );
  return response.json();
};

// MFA
export const setupMfa = async (data: {
  userId: string;
  method: 'totp' | 'sms' | 'email' | 'webauthn';
}): Promise<any> => {
  const response = await fetch(`${API_BASE}/mfa/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const verifyMfa = async (data: {
  userId: string;
  code: string;
  method: string;
}): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const disableMfa = async (userId: string): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/mfa/disable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return response.json();
};

export const getMfaStatus = async (userId: string): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/mfa/status/${userId}`);
  return response.json();
};

// Compliance
export const getGdprCompliance = async (): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/compliance/gdpr`);
  return response.json();
};

export const getCcpaCompliance = async (): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/compliance/ccpa`);
  return response.json();
};

export const getComplianceReport = async (type: string): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/compliance/report?type=${type}`);
  return response.json();
};

// Consent
export const getUserConsent = async (userId: string): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/consent/${userId}`);
  return response.json();
};

export const updateConsent = async (data: {
  userId: string;
  consentType: string;
  granted: boolean;
  version: string;
}): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const exportUserData = async (userId: string): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/consent/${userId}/export`);
  return response.json();
};

export const deleteUserData = async (userId: string): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/consent/${userId}`, {
    method: 'DELETE',
  });
  return response.json();
};

// Vulnerabilities
export const getVulnerabilities = async (): Promise<ApiResponse<unknown[]>> => {
  const response = await fetch(`${API_BASE}/vulnerabilities`);
  return response.json();
};

export const runVulnerabilityScan = async (): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/vulnerabilities/scan`, {
    method: 'POST',
  });
  return response.json();
};

export const patchVulnerability = async (vulnerabilityId: string): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/vulnerabilities/${vulnerabilityId}/patch`, {
    method: 'POST',
  });
  return response.json();
};

export const getVulnerabilityReport = async (): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/vulnerabilities/report`);
  return response.json();
};

// API Security
export const getRateLimits = async (): Promise<ApiResponse<unknown[]>> => {
  const response = await fetch(`${API_BASE}/api-security/rate-limits`);
  return response.json();
};

export const updateRateLimit = async (
  endpoint: string,
  limits: { maxRequests: number; windowSeconds: number },
): Promise<ApiResponse<unknown>> => {
  const response = await fetch(`${API_BASE}/api-security/rate-limits/${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(limits),
  });
  return response.json();
};

export const SecurityService = {
  getSecurityDashboard,
  getThreats,
  mitigateThreat,
  getEncryptionStatus,
  rotateEncryptionKey,
  getAuditLogs,
  exportAuditLogs,
  setupMfa,
  verifyMfa,
  disableMfa,
  getMfaStatus,
  getGdprCompliance,
  getCcpaCompliance,
  getComplianceReport,
  getUserConsent,
  updateConsent,
  exportUserData,
  deleteUserData,
  getVulnerabilities,
  runVulnerabilityScan,
  patchVulnerability,
  getVulnerabilityReport,
  getRateLimits,
  updateRateLimit,
  applyRetentionPolicies: async (): Promise<ApiResponse<unknown>> => {
    const response = await fetch(`${API_BASE}/retention/apply`, {
      method: 'POST',
    });
    return response.json();
  },
};

export default SecurityService;
