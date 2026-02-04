import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface ABVariant {
  id: string;
  name: string;
  config: any;
}

interface UseABTestingReturn {
  variant: ABVariant | null;
  isLoading: boolean;
  error: string | null;
  recordConversion: (conversionType: string, value?: any) => Promise<void>;
  refreshVariant: () => Promise<void>;
}

export function useABTesting(
  testName: string,
  userId: string,
): UseABTestingReturn {
  const [variant, setVariant] = useState<ABVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);

  const fetchVariant = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.post(`/api/ab-testing/assign/${testName}`);
      if (response.data.success) {
        setVariant({
          id: response.data.data.variantId,
          name: response.data.data.variantId,
          config: response.data.data.metadata?.config || {},
        });
        setAssignmentId(response.data.data.id);
      } else {
        setError(response.data.error || 'Failed to assign variant');
      }
    } catch (err: any) {
      // If user is not in test population, it's not an error
      if (err.response?.data?.error === 'User not in test population') {
        setVariant(null);
        setError(null);
      } else {
        setError('Failed to fetch A/B test variant');
        console.error('Error fetching A/B test variant:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [testName]);

  useEffect(() => {
    fetchVariant();
  }, [fetchVariant]);

  const recordConversion = useCallback(
    async (conversionType: string, value?: any) => {
      if (!assignmentId) {
        console.warn('No assignment ID found for conversion tracking');
        return;
      }

      try {
        await api.post(`/api/ab-testing/conversion/${assignmentId}`, {
          conversionType,
          value,
        });
      } catch (err) {
        console.error('Error recording conversion:', err);
      }
    },
    [assignmentId],
  );

  const refreshVariant = useCallback(async () => {
    await fetchVariant();
  }, [fetchVariant]);

  return {
    variant,
    isLoading,
    error,
    recordConversion,
    refreshVariant,
  };
}

// Hook for getting the current variant configuration
export function useABTestVariant<T = any>(testName: string, userId: string): {
  variant: T | null;
  isLoading: boolean;
  error: string | null;
} {
  const { variant, isLoading, error } = useABTesting(testName, userId);

  return {
    variant: variant?.config as T || null,
    isLoading,
    error,
  };
}

// Hook for checking if a feature is enabled
export function useFeatureFlag(
  featureName: string,
  userId: string,
  defaultValue: boolean = false,
): {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
} {
  const { variant, isLoading, error } = useABTesting(`feature_${featureName}`, userId);

  // If variant is null, use default value
  if (!variant && !error) {
    return {
      isEnabled: defaultValue,
      isLoading,
      error: null,
    };
  }

  // Check if feature is enabled in variant config
  const isEnabled = variant?.config?.enabled ?? defaultValue;

  return {
    isEnabled,
    isLoading,
    error,
  };
}
