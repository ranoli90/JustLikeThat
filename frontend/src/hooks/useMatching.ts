import { useState, useCallback } from 'react';

export interface MatchResult {
  jobPostingId: string;
  personaId: string;
  overallScore: number;
  breakdown: {
    skills: number;
    experience: number;
    salary: number;
    location: number;
    culture: number;
    constraints: number;
  };
  thresholdMet: boolean;
}

export interface LTRMatchResult {
  jobPostingId: string;
  personaId: string;
  overallScore: number;
  breakdown: Record<string, number>;
  ranking: number;
  confidence: number;
  explanations: string[];
}

export interface JobRecommendation {
  jobPosting: {
    id: string;
    title: string;
    company: string;
    location: string;
    remotePreference: string;
    jobType: string;
    salaryRange?: { min: number; max: number };
    description: string;
    applyUrl: string;
  };
  matchResult: LTRMatchResult;
  whyRecommended: string[];
  potentialConcerns: string[];
  applied: boolean;
  saved: boolean;
}

export interface MatchQualityExplanation {
  overallScore: number;
  scoreBand: 'excellent' | 'good' | 'moderate' | 'poor';
  summary: string;
  strengths: Array<{
    category: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    evidence: string;
  }>;
  weaknesses: Array<{
    category: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    mitigation?: string;
  }>;
  skillAnalysis: {
    matchedSkills: string[];
    missingSkills: string[];
    bonusSkills: string[];
    skillMatchScore: number;
    recommendations: string[];
  };
  experienceAnalysis: {
    levelMatch: 'perfect' | 'good' | 'acceptable' | 'mismatch';
    yearsExperience: { required: number; actual: number };
    domainExpertise: string;
    gapAnalysis: string;
  };
  cultureAnalysis: {
    score: number;
    matchedValues: string[];
    workStyleFit: string;
    recommendations: string[];
  };
  careerAnalysis: {
    trajectoryScore: number;
    nextRole: string;
    salaryGrowth: number;
    growthPotential: 'high' | 'medium' | 'low';
    recommendations: string[];
  };
  recommendations: string[];
  questionsToAsk: string[];
  redFlags: string[];
  greenFlags: string[];
}

const API_BASE = '/api/matching';

export function useMatching() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findMatches = useCallback(async (personaId: string): Promise<MatchResult[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/${personaId}/matches`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateMatchScore = useCallback(async (
    personaId: string,
    jobPostingId: string
  ): Promise<MatchResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId, jobPostingId }),
      });
      if (!response.ok) throw new Error('Failed to calculate match score');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const explainMatch = useCallback(async (
    persona: any,
    jobPosting: any
  ): Promise<MatchQualityExplanation | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, jobPosting }),
      });
      if (!response.ok) throw new Error('Failed to explain match');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecommendations = useCallback(async (params: {
    userId: string;
    personaId: string;
    preferences: any;
    searchQuery?: string;
    location?: string;
    filters?: Record<string, any>;
    limit?: number;
  }): Promise<JobRecommendation[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getSimilarJobs = useCallback(async (
    jobPostingId: string,
    personaId: string,
    limit?: number
  ): Promise<JobRecommendation[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        API_BASE + '/recommendations/similar/' + jobPostingId + '/' + personaId + (limit ? '?limit=' + limit : '')
      );
      if (!response.ok) throw new Error('Failed to fetch similar jobs');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getCareerGrowthRecommendations = useCallback(async (
    personaId: string,
    limit?: number
  ): Promise<JobRecommendation[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        API_BASE + '/recommendations/career-growth/' + personaId + (limit ? '?limit=' + limit : '')
      );
      if (!response.ok) throw new Error('Failed to fetch career growth recommendations');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const recordInteraction = useCallback(async (
    personaId: string,
    jobPostingId: string,
    interaction: 'save' | 'unsave' | 'view' | 'apply' | 'dismiss'
  ): Promise<void> => {
    try {
      await fetch(`${API_BASE}/recommendations/interaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId, jobPostingId, interaction }),
      });
    } catch (err) {
      console.error('Failed to record interaction:', err);
    }
  }, []);

  const rankJobs = useCallback(async (
    persona: Record<string, unknown>,
    jobPostings: Record<string, unknown>[]
  ): Promise<LTRMatchResult[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/ltr/rank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, jobPostings }),
      });
      if (!response.ok) throw new Error('Failed to rank jobs');
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getModelParameters = useCallback(async (): Promise<{
    weights: Record<string, number>;
    feedbackCount: number;
  } | null> => {
    try {
      const response = await fetch(`${API_BASE}/ltr/model-parameters`);
      if (!response.ok) throw new Error('Failed to fetch model parameters');
      return response.json();
    } catch (err) {
      console.error('Failed to fetch model parameters:', err);
      return null;
    }
  }, []);

  const recordLtrFeedback = useCallback(async (
    personaId: string,
    jobPostingId: string,
    feedback: 'positive' | 'negative' | 'neutral',
    applied?: boolean,
    interview?: boolean,
    offer?: boolean
  ): Promise<void> => {
    try {
      await fetch(`${API_BASE}/ltr/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId, jobPostingId, feedback, applied, interview, offer }),
      });
    } catch (err) {
      console.error('Failed to record LTR feedback:', err);
    }
  }, []);

  const getCulturalDimensions = useCallback(async (): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE}/cultural-fit/dimensions`);
      if (!response.ok) throw new Error('Failed to fetch cultural dimensions');
      return response.json();
    } catch (err) {
      console.error('Failed to fetch cultural dimensions:', err);
      return [];
    }
  }, []);

  const predictCareerTrajectory = useCallback(async (
    persona: Record<string, unknown>,
    jobPosting: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> => {
    try {
      const response = await fetch(`${API_BASE}/career/trajectory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, jobPosting }),
      });
      if (!response.ok) throw new Error('Failed to predict career trajectory');
      return response.json();
    } catch (err) {
      console.error('Failed to predict career trajectory:', err);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    findMatches,
    calculateMatchScore,
    explainMatch,
    getRecommendations,
    getSimilarJobs,
    getCareerGrowthRecommendations,
    recordInteraction,
    rankJobs,
    getModelParameters,
    recordLtrFeedback,
    getCulturalDimensions,
    predictCareerTrajectory,
  };
}
