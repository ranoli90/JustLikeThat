import { useState, useEffect, useCallback } from 'react';
import { feedbackAPI } from '../services/api';

interface OnboardingStep {
  id: string;
  name: string;
  completed: boolean;
  timeSpent: number;
  startedAt?: number;
}

interface OnboardingFeedback {
  totalSteps: number;
  completedSteps: number;
  averageTimePerStep: number;
  dropOffPoints: { stepId: string; count: number }[];
  userRating: number | null;
  userComments: string;
}

interface UseOnboardingFeedbackReturn {
  steps: OnboardingStep[];
  feedback: OnboardingFeedback;
  isLoading: boolean;
  error: string | null;
  startStep: (stepId: string) => void;
  completeStep: (stepId: string) => void;
  submitFeedback: (rating: number, comments?: string) => Promise<void>;
  resetOnboarding: () => void;
}

export function useOnboardingFeedback(
  userId: string,
  onboardingSteps: { id: string; name: string }[],
): UseOnboardingFeedbackReturn {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [feedback, setFeedback] = useState<OnboardingFeedback>({
    totalSteps: onboardingSteps.length,
    completedSteps: 0,
    averageTimePerStep: 0,
    dropOffPoints: [],
    userRating: null,
    userComments: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize steps
  useEffect(() => {
    const savedSteps = localStorage.getItem(`onboarding_steps_${userId}`);
    if (savedSteps) {
      setSteps(JSON.parse(savedSteps));
    } else {
      const initialSteps = onboardingSteps.map((step) => ({
        ...step,
        completed: false,
        timeSpent: 0,
      }));
      setSteps(initialSteps);
      localStorage.setItem(`onboarding_steps_${userId}`, JSON.stringify(initialSteps));
    }
  }, [userId, onboardingSteps]);

  // Update feedback metrics when steps change
  useEffect(() => {
    const completedSteps = steps.filter((s) => s.completed).length;
    const totalTime = steps.reduce((sum, s) => sum + s.timeSpent, 0);
    const averageTime = completedSteps > 0 ? totalTime / completedSteps : 0;

    setFeedback((prev) => ({
      ...prev,
      totalSteps: steps.length,
      completedSteps,
      averageTimePerStep: averageTime,
    }));
  }, [steps]);

  const startStep = useCallback((stepId: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === stepId) {
          return { ...step, startedAt: Date.now() };
        }
        return step;
      }),
    );
  }, []);

  const completeStep = useCallback((stepId: string) => {
    setSteps((prev) => {
      const updated = prev.map((step) => {
        if (step.id === stepId) {
          const timeSpent = step.startedAt
            ? Date.now() - step.startedAt
            : 0;
          return { ...step, completed: true, timeSpent };
        }
        return step;
      });
      localStorage.setItem(`onboarding_steps_${userId}`, JSON.stringify(updated));
      return updated;
    });
  }, [userId]);

  const submitFeedback = useCallback(
    async (rating: number, comments?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Calculate drop-off points
        const dropOffPoints = steps
          .filter((s) => !s.completed)
          .map((s) => ({ stepId: s.id, count: 1 }));

        // Submit feedback via API
        await feedbackAPI.submitFeedback({
          type: 'NPS',
          trigger: 'ONBOARDING',
          rating,
          comment: comments,
          metadata: {
            totalSteps: steps.length,
            completedSteps: steps.filter((s) => s.completed).length,
            averageTimePerStep: feedback.averageTimePerStep,
            dropOffPoints,
          },
        });

        setFeedback((prev) => ({
          ...prev,
          userRating: rating,
          userComments: comments || '',
        }));
      } catch (err) {
        setError('Failed to submit feedback');
        console.error('Error submitting onboarding feedback:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [steps, feedback.averageTimePerStep],
  );

  const resetOnboarding = useCallback(() => {
    const initialSteps = onboardingSteps.map((step) => ({
      ...step,
      completed: false,
      timeSpent: 0,
    }));
    setSteps(initialSteps);
    localStorage.setItem(`onboarding_steps_${userId}`, JSON.stringify(initialSteps));
    setFeedback((prev) => ({
      ...prev,
      userRating: null,
      userComments: '',
    }));
  }, [userId, onboardingSteps]);

  return {
    steps,
    feedback,
    isLoading,
    error,
    startStep,
    completeStep,
    submitFeedback,
    resetOnboarding,
  };
}
