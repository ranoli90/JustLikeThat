/**
 * Jobs Slice - Redux state management for job search
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface JobPosting {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logoUrl: string | null;
    website: string | null;
    size: string;
    industry: string;
  };
  location: {
    city: string;
    state: string | null;
    country: string;
    zipCode: string | null;
    coordinates: { latitude: number; longitude: number } | null;
  };
  jobType: string;
  description: string;
  requirements: string[];
  salaryRange: { min: number; max: number; currency: string; period: string } | null;
  applicationDeadline: string | null;
  postedAt: string;
  remoteType: string;
  skills: string[];
  benefits: string[];
  applicationCount: number;
  isSaved: boolean;
}

export interface JobSearchCriteria {
  query: string | null;
  location: { city: string; state: string | null; country: string } | null;
  jobTypes: string[];
  remoteTypes: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  experienceLevels: string[];
  skills: string[];
  industries: string[];
  companySizes: string[];
  postedWithin: string | null;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface JobsState {
  jobs: JobPosting[];
  savedJobs: JobPosting[];
  recommendedJobs: JobPosting[];
  searchCriteria: JobSearchCriteria;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
}

// Initial state
const initialState: JobsState = {
  jobs: [],
  savedJobs: [],
  recommendedJobs: [],
  searchCriteria: {
    query: null,
    location: null,
    jobTypes: [],
    remoteTypes: [],
    salaryMin: null,
    salaryMax: null,
    experienceLevels: [],
    skills: [],
    industries: [],
    companySizes: [],
    postedWithin: null,
    page: 1,
    limit: 20,
    sortBy: 'relevance',
    sortOrder: 'desc',
  },
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMore: true,
};

// Create slice
const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs: (state, action: PayloadAction<{ jobs: JobPosting[]; hasMore: boolean }>) => {
      state.jobs = action.payload.jobs;
      state.hasMore = action.payload.hasMore;
      state.isLoading = false;
      state.error = null;
    },
    appendJobs: (state, action: PayloadAction<{ jobs: JobPosting[]; hasMore: boolean }>) => {
      state.jobs = [...state.jobs, ...action.payload.jobs];
      state.hasMore = action.payload.hasMore;
      state.isLoadingMore = false;
    },
    setSavedJobs: (state, action: PayloadAction<JobPosting[]>) => {
      state.savedJobs = action.payload;
    },
    setRecommendedJobs: (state, action: PayloadAction<JobPosting[]>) => {
      state.recommendedJobs = action.payload;
    },
    toggleSaveJob: (state, action: PayloadAction<string>) => {
      const jobId = action.payload;
      const jobIndex = state.jobs.findIndex(j => j.id === jobId);
      if (jobIndex !== -1) {
        state.jobs[jobIndex].isSaved = !state.jobs[jobIndex].isSaved;
      }
      const savedIndex = state.savedJobs.findIndex(j => j.id === jobId);
      if (savedIndex !== -1) {
        state.savedJobs.splice(savedIndex, 1);
      } else {
        const job = state.jobs.find(j => j.id === jobId);
        if (job) {
          state.savedJobs.push({ ...job, isSaved: true });
        }
      }
    },
    setSearchCriteria: (state, action: PayloadAction<Partial<JobSearchCriteria>>) => {
      state.searchCriteria = { ...state.searchCriteria, ...action.payload };
    },
    setLoading: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    setLoadingMore: (state) => {
      state.isLoadingMore = true;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isLoadingMore = false;
      state.error = action.payload;
    },
    clearJobs: (state) => {
      state.jobs = [];
      state.searchCriteria.page = 1;
      state.hasMore = true;
    },
  },
});

// Export actions
export const {
  setJobs,
  appendJobs,
  setSavedJobs,
  setRecommendedJobs,
  toggleSaveJob,
  setSearchCriteria,
  setLoading,
  setLoadingMore,
  setError,
  clearJobs,
} = jobsSlice.actions;

// Export reducer
export default jobsSlice.reducer;

// Selectors
export const selectJobs = (state: { jobs: JobsState }) => state.jobs.jobs;
export const selectSavedJobs = (state: { jobs: JobsState }) => state.jobs.savedJobs;
export const selectRecommendedJobs = (state: { jobs: JobsState }) => state.jobs.recommendedJobs;
export const selectJobsLoading = (state: { jobs: JobsState }) => state.jobs.isLoading;
export const selectHasMore = (state: { jobs: JobsState }) => state.jobs.hasMore;
export const selectSearchCriteria = (state: { jobs: JobsState }) => state.jobs.searchCriteria;
