// Core types for the mobile application

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  jobSearch: JobSearchPreferences;
  privacy: PrivacyPreferences;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  applicationUpdates: boolean;
  interviewReminders: boolean;
  jobMatches: boolean;
}

export interface JobSearchPreferences {
  keywords: string[];
  locations: string[];
  remoteOnly: boolean;
  salaryRange: { min: number; max: number };
  jobTypes: string[];
  experienceLevel: string[];
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private' | 'recruiters_only';
  showSalary: boolean;
  allowContact: boolean;
}

export interface JobPosting {
  id: string;
  title: string;
  company: Company;
  location: string;
  remoteType: 'remote' | 'hybrid' | 'onsite';
  salary?: SalaryRange;
  jobType: string;
  experienceLevel: string;
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: Date;
  applicationDeadline?: Date;
  source: string;
  url: string;
  matchScore?: number;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  size: string;
  industry: string;
  description?: string;
  website?: string;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: 'hourly' | 'monthly' | 'yearly';
}

export interface Application {
  id: string;
  userId: string;
  jobPosting: JobPosting;
  status: ApplicationStatus;
  appliedDate: Date;
  lastUpdated: Date;
  notes: string;
  documents: Document[];
  interviewRounds: InterviewRound[];
  timeline: ApplicationTimeline[];
}

export type ApplicationStatus = 
  | 'draft'
  | 'submitted'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface Document {
  id: string;
  name: string;
  type: 'resume' | 'cover_letter' | 'portfolio' | 'other';
  url: string;
  localPath?: string;
  uploadedAt: Date;
  isSynced: boolean;
}

export interface InterviewRound {
  id: string;
  type: 'phone' | 'video' | 'onsite' | 'technical' | 'behavioral';
  scheduledDate: Date;
  duration: number;
  interviewers: string[];
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  feedback?: string;
  notes: string;
}

export interface ApplicationTimeline {
  id: string;
  date: Date;
  action: string;
  description: string;
  icon?: string;
}

export interface InterviewSession {
  id: string;
  applicationId: string;
  type: 'practice' | 'real';
  questions: InterviewQuestion[];
  answers: string[];
  feedback: InterviewFeedback;
  scheduledDate?: Date;
  duration: number;
  status: 'upcoming' | 'in_progress' | 'completed';
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'behavioral' | 'technical' | 'company_specific' | 'role_specific';
  difficulty: 'easy' | 'medium' | 'hard';
  tips: string[];
  sampleAnswer?: string;
}

export interface InterviewFeedback {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  detailedScores: {
    clarity: number;
    relevance: number;
    confidence: number;
    completeness: number;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: Date;
}

export type NotificationType = 
  | 'application_update'
  | 'interview_reminder'
  | 'job_match'
  | 'deadline_reminder'
  | 'system';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  data: Record<string, unknown>;
  timestamp: Date;
  synced: boolean;
}

export interface SyncStatus {
  lastSyncTime: Date | null;
  pendingChanges: number;
  isOnline: boolean;
  syncInProgress: boolean;
}
