export interface UserPreferences {
  id: number;
  jobTitle: string;
  location: string;
  remoteWork: boolean;
  minSalary: number;
  maxSalary: number;
  jobType: string;
  skills: string[];
}

export interface CandidateProfile {
  id: number;
  userId: number;
  about: string;
  experience: string;
  education: string;
  skills: string[];
  resumeUrl?: string;
}

export interface UpdateProfileData {
  about?: string;
  experience?: string;
  education?: string;
  skills?: string[];
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
