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

// Feedback API
export const feedbackAPI = {
  submitFeedback: async (data: {
    type: string;
    trigger: string;
    rating?: number;
    comment?: string;
    metadata?: any;
  }): Promise<any> => {
    const response = await api.post('/api/feedback', data);
    return response.data;
  },

  getUserFeedback: async (): Promise<any[]> => {
    const response = await api.get('/api/feedback');
    return response.data;
  },

  getFeedbackAnalytics: async (): Promise<any> => {
    const response = await api.get('/api/feedback/analytics');
    return response.data;
  },

  getUserSegments: async (): Promise<any> => {
    const response = await api.get('/api/feedback/segments');
    return response.data;
  },

  getFeedbackByTrigger: async (trigger: string): Promise<any[]> => {
    const response = await api.get(`/api/feedback/trigger/${trigger}`);
    return response.data;
  },
};

// Interview API
export const interviewAPI = {
  // Sessions
  createSession: async (data: {
    userId: string;
    applicationId?: string;
    interviewType: string;
    interviewFormat: string;
    companyName?: string;
    jobTitle?: string;
  }): Promise<any> => {
    const response = await api.post('/interview/sessions', data);
    return response.data;
  },

  getUserSessions: async (userId: string): Promise<any[]> => {
    const response = await api.get('/interview/sessions', { params: { userId } });
    return response.data;
  },

  getSession: async (sessionId: string): Promise<any> => {
    const response = await api.get(`/interview/sessions/${sessionId}`);
    return response.data;
  },

  startPractice: async (sessionId: string, data: { questionType: string; count?: number }): Promise<any> => {
    const response = await api.post(`/interview/sessions/${sessionId}/practice`, data);
    return response.data;
  },

  submitAnswer: async (sessionId: string, questionId: string, answer: string): Promise<any> => {
    const response = await api.post(`/interview/sessions/${sessionId}/answer`, { questionId, answer });
    return response.data;
  },

  completeSession: async (sessionId: string): Promise<any> => {
    const response = await api.post(`/interview/sessions/${sessionId}/complete`);
    return response.data;
  },

  scheduleSession: async (sessionId: string, interviewDate: string, timezone: string): Promise<any> => {
    const response = await api.post(`/interview/sessions/${sessionId}/schedule`, { interviewDate, timezone });
    return response.data;
  },

  getPreparationTips: async (sessionId: string): Promise<any> => {
    const response = await api.get(`/interview/sessions/${sessionId}/tips`);
    return response.data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/interview/sessions/${sessionId}`);
  },

  // Company Research
  researchCompany: async (sessionId: string, companyName: string): Promise<any> => {
    const response = await api.post(`/interview/sessions/${sessionId}/company`, { companyName });
    return response.data;
  },

  getCompanyInsight: async (sessionId: string): Promise<any> => {
    const response = await api.get(`/interview/sessions/${sessionId}/company`);
    return response.data;
  },

  // Questions
  generateQuestions: async (type: string, jobTitle?: string, count?: number): Promise<any[]> => {
    const response = await api.get('/interview/questions/generate', { params: { type, jobTitle, count } });
    return response.data;
  },

  getBehavioralQuestions: async (count?: number): Promise<any[]> => {
    const response = await api.get('/interview/questions/behavioral', { params: { count } });
    return response.data;
  },

  getTechnicalQuestions: async (jobTitle?: string, count?: number): Promise<any[]> => {
    const response = await api.get('/interview/questions/technical', { params: { jobTitle, count } });
    return response.data;
  },

  getAnswerStructure: async (type: string): Promise<any> => {
    const response = await api.get(`/interview/questions/structure/${type}`);
    return response.data;
  },

  // Scheduling
  getSchedule: async (sessionId: string): Promise<any> => {
    const response = await api.get(`/interview/sessions/${sessionId}/schedule`);
    return response.data;
  },

  getPreparationTipsByFormat: async (sessionId: string): Promise<any> => {
    const response = await api.get(`/interview/sessions/${sessionId}/preparation-tips`);
    return response.data;
  },

  getDressCodeGuidance: async (companyType: string): Promise<any> => {
    const response = await api.get(`/interview/dress-code/${companyType}`);
    return response.data;
  },

  // Salary Negotiation
  createNegotiation: async (data: {
    userId: string;
    company: string;
    position: string;
    targetSalary?: number;
    minimumAcceptable?: number;
  }): Promise<any> => {
    const response = await api.post('/interview/negotiation', data);
    return response.data;
  },

  getNegotiation: async (negotiationId: string): Promise<any> => {
    const response = await api.get(`/interview/negotiation/${negotiationId}`);
    return response.data;
  },

  getUserNegotiations: async (userId: string): Promise<any[]> => {
    const response = await api.get(`/interview/negotiation/user/${userId}`);
    return response.data;
  },

  getMarketSalaryRange: async (position: string, location?: string, experience?: string): Promise<any> => {
    const response = await api.get('/interview/salary-range', { params: { position, location, experience } });
    return response.data;
  },

  getNegotiationStrategy: async (negotiationId: string): Promise<any> => {
    const response = await api.get(`/interview/negotiation/${negotiationId}/strategy`);
    return response.data;
  },

  // Post Interview
  createFollowUp: async (data: {
    userId: string;
    applicationId: string;
    interviewDate: string;
    followUpType: string;
    message?: string;
  }): Promise<any> => {
    const response = await api.post('/interview/follow-up', data);
    return response.data;
  },

  getUserFollowUps: async (userId: string): Promise<any[]> => {
    const response = await api.get(`/interview/follow-up/user/${userId}`);
    return response.data;
  },

  getPendingFollowUps: async (userId: string): Promise<any[]> => {
    const response = await api.get(`/interview/follow-up/pending/${userId}`);
    return response.data;
  },

  updateFollowUpStatus: async (id: string, status: string, message?: string): Promise<any> => {
    const response = await api.put(`/interview/follow-up/${id}/status`, { status, message });
    return response.data;
  },

  generateThankYouNote: async (params: {
    interviewerName?: string;
    companyName: string;
    position: string;
    keyTopics: string[];
    interviewDate: string;
  }): Promise<any> => {
    const response = await api.post('/interview/thank-you-template', params);
    return response.data;
  },

  generateFollowUpNote: async (params: {
    companyName: string;
    position: string;
    lastContactDate: string;
    status: string;
  }): Promise<any> => {
    const response = await api.post('/interview/follow-up-template', params);
    return response.data;
  },

  getPostInterviewGuidance: async (): Promise<any> => {
    const response = await api.get('/interview/guidance');
    return response.data;
  },
};

// Career API
export const careerAPI = {
  // Career Paths
  getCareerPaths: async (userId: string): Promise<any[]> => {
    const response = await api.get('/career/paths', { params: { userId } });
    return response.data;
  },

  getCareerPath: async (pathId: string): Promise<any> => {
    const response = await api.get(`/career/paths/${pathId}`);
    return response.data;
  },

  createCareerPath: async (userId: string, data: any): Promise<any> => {
    const response = await api.post('/career/paths', { userId, data });
    return response.data;
  },

  updateCareerPath: async (pathId: string, data: any): Promise<any> => {
    const response = await api.put(`/career/paths/${pathId}`, data);
    return response.data;
  },

  getCareerRecommendations: async (userId: string, currentRole: string, targetRole: string, industry: string): Promise<any[]> => {
    const response = await api.post('/career/recommendations', { userId, currentRole, targetRole, industry });
    return response.data;
  },

  // Skill Gap Analysis
  analyzeSkillGaps: async (userId: string, targetRole: string, industry: string): Promise<any> => {
    const response = await api.post('/career/skill-gap-analysis', { userId, targetRole, industry });
    return response.data;
  },

  getSkillGaps: async (userId: string): Promise<any[]> => {
    const response = await api.get('/career/skill-gaps', { params: { userId } });
    return response.data;
  },

  // Learning Resources
  getLearningResources: async (userId: string, status?: string): Promise<any[]> => {
    const response = await api.get('/career/learning-resources', { params: { userId, status } });
    return response.data;
  },

  addLearningResource: async (userId: string, data: any): Promise<any> => {
    const response = await api.post('/career/learning-resources', { userId, data });
    return response.data;
  },

  updateLearningResource: async (resourceId: string, data: any): Promise<any> => {
    const response = await api.put(`/career/learning-resources/${resourceId}`, data);
    return response.data;
  },

  getLearningRecommendations: async (userId: string): Promise<any[]> => {
    const response = await api.get(`/career/learning-resources/recommendations/${userId}`);
    return response.data;
  },

  // Certifications
  getCertifications: async (userId: string): Promise<any[]> => {
    const response = await api.get('/career/certifications', { params: { userId } });
    return response.data;
  },

  addCertification: async (userId: string, data: any): Promise<any> => {
    const response = await api.post('/career/certifications', { userId, data });
    return response.data;
  },

  getCertificationTemplates: async (category?: string): Promise<any[]> => {
    const response = await api.get('/career/certifications/templates', { params: { category } });
    return response.data;
  },

  getCertificationRecommendations: async (userId: string, targetRole: string): Promise<any[]> => {
    const response = await api.post('/career/certifications/recommendations', { userId, targetRole });
    return response.data;
  },

  // Milestones
  getMilestones: async (userId: string): Promise<any[]> => {
    const response = await api.get('/career/milestones', { params: { userId } });
    return response.data;
  },

  createMilestone: async (userId: string, data: any): Promise<any> => {
    const response = await api.post('/career/milestones', { userId, data });
    return response.data;
  },

  updateMilestone: async (milestoneId: string, data: any): Promise<any> => {
    const response = await api.put(`/career/milestones/${milestoneId}`, data);
    return response.data;
  },

  getMilestoneTemplates: async (industry?: string): Promise<any[]> => {
    const response = await api.get('/career/milestones/templates', { params: { industry } });
    return response.data;
  },

  // Goals
  getGoals: async (userId: string, timeframe?: string): Promise<any[]> => {
    const response = await api.get('/career/goals', { params: { userId, timeframe } });
    return response.data;
  },

  createGoal: async (userId: string, data: any): Promise<any> => {
    const response = await api.post('/career/goals', { userId, data });
    return response.data;
  },

  updateGoal: async (goalId: string, data: any): Promise<any> => {
    const response = await api.put(`/career/goals/${goalId}`, data);
    return response.data;
  },

  updateGoalProgress: async (goalId: string, progress: number): Promise<any> => {
    const response = await api.put(`/career/goals/${goalId}/progress`, { progress });
    return response.data;
  },

  // Mentorship
  getMentorships: async (userId: string): Promise<any[]> => {
    const response = await api.get('/career/mentorships', { params: { userId } });
    return response.data;
  },

  createMentorship: async (userId: string, data: any): Promise<any> => {
    const response = await api.post('/career/mentorships', { userId, data });
    return response.data;
  },

  getMentorshipRelationship: async (relationshipId: string): Promise<any> => {
    const response = await api.get(`/career/mentorships/${relationshipId}`);
    return response.data;
  },

  addMentorMeeting: async (relationshipId: string, meeting: any): Promise<any> => {
    const response = await api.post(`/career/mentorships/${relationshipId}/meetings`, meeting);
    return response.data;
  },

  findMentors: async (userId: string, criteria: { expertise?: string; industries?: string; levels?: string }): Promise<any[]> => {
    const response = await api.get('/career/mentors/search', { params: { userId, ...criteria } });
    return response.data;
  },

  // Salary Projections
  getSalaryProjections: async (userId: string): Promise<any[]> => {
    const response = await api.get('/career/salary/projections', { params: { userId } });
    return response.data;
  },

  generateSalaryProjection: async (userId: string, role: string, industry: string, location: string): Promise<any> => {
    const response = await api.post('/career/salary/projections', { userId, role, industry, location });
    return response.data;
  },

  getSalaryHistory: async (userId: string): Promise<any[]> => {
    const response = await api.get('/career/salary/history', { params: { userId } });
    return response.data;
  },

  addSalaryHistory: async (userId: string, data: any): Promise<any> => {
    const response = await api.post('/career/salary/history', { userId, data });
    return response.data;
  },

  // Industry Trends
  getIndustryTrends: async (type?: string): Promise<any[]> => {
    const response = await api.get('/career/trends', { params: { type } });
    return response.data;
  },

  getSkillPredictions: async (): Promise<any[]> => {
    const response = await api.get('/career/trends/predictions');
    return response.data;
  },

  getRelevantTrends: async (userId: string): Promise<any> => {
    const response = await api.get(`/career/trends/relevant/${userId}`);
    return response.data;
  },

  // Dashboard
  getCareerDashboard: async (userId: string): Promise<any> => {
    const response = await api.get(`/career/dashboard/${userId}`);
    return response.data;
  },
};

export default api;
