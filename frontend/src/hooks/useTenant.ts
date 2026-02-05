import { useState, useEffect, useCallback } from 'react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  subdomain: string | null;
  plan: string;
  status: string;
  dataResidency: string;
  createdAt: string;
  updatedAt: string;
}

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenant = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get tenant ID from context or URL
      const tenantId = getCurrentTenantId();
      
      if (!tenantId) {
        setTenant(null);
        return;
      }

      const response = await fetch(`/api/v1/tenants/${tenantId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load tenant');
      }

      const data = await response.json();
      setTenant(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  const refreshTenant = useCallback(() => {
    loadTenant();
  }, [loadTenant]);

  return {
    tenant,
    loading,
    error,
    refreshTenant,
    setTenant,
  };
}

export function useFeatureFlag(featureKey: string) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        setLoading(true);
        const tenantId = getCurrentTenantId();
        
        if (!tenantId) {
          setIsEnabled(false);
          return;
        }

        const response = await fetch(`/api/v1/tenants/${tenantId}/features/${featureKey}/check`);
        const data = await response.json();
        setIsEnabled(data.isEnabled);
      } catch (err: any) {
        setError(err.message);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeature();
  }, [featureKey]);

  return { isEnabled, loading, error };
}

export function useBranding() {
  const [branding, setBranding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        setLoading(true);
        const tenantId = getCurrentTenantId();
        
        if (!tenantId) {
          setBranding(null);
          return;
        }

        const response = await fetch(`/api/v1/tenants/${tenantId}/branding`);
        const data = await response.json();
        setBranding(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBranding();
  }, []);

  return { branding, loading, error };
}

// Helper function to get current tenant ID
function getCurrentTenantId(): string | null {
  // Try to get from URL first
  const pathParts = window.location.pathname.split('/');
  const tenantIndex = pathParts.findIndex(p => p === 'tenants' || p === 'tenant');
  
  if (tenantIndex !== -1 && pathParts[tenantIndex + 1]) {
    return pathParts[tenantIndex + 1];
  }

  // Try to get from localStorage
  const storedTenant = localStorage.getItem('currentTenantId');
  if (storedTenant) {
    return storedTenant;
  }

  // Try to get from session
  const sessionTenant = sessionStorage.getItem('currentTenantId');
  if (sessionTenant) {
    return sessionTenant;
  }

  return null;
}

export function setCurrentTenantId(tenantId: string) {
  localStorage.setItem('currentTenantId', tenantId);
  sessionStorage.setItem('currentTenantId', tenantId);
}
