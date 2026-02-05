import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface FeatureFlag {
  id: string;
  featureKey: string;
  featureName: string;
  isEnabled: boolean;
  config: any;
  priority: number;
}

export const FeatureFlags: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  useEffect(() => {
    loadFeatures();
  }, [tenantId]);

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/tenants/${tenantId}/features`);
      const data = await response.json();
      setFeatures(data);
    } catch (err) {
      console.error('Failed to load features:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureKey: string, currentState: boolean) => {
    try {
      await fetch(`/api/v1/tenants/${tenantId}/features/${featureKey}/toggle`, {
        method: 'POST',
      });
      loadFeatures();
    } catch (err) {
      console.error('Failed to toggle feature:', err);
    }
  };

  const updateFeatureConfig = async (featureKey: string, config: any) => {
    try {
      await fetch(`/api/v1/tenants/${tenantId}/features/${featureKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      loadFeatures();
    } catch (err) {
      console.error('Failed to update feature config:', err);
    }
  };

  const filteredFeatures = features.filter(f => {
    const matchesSearch = f.featureName.toLowerCase().includes(search.toLowerCase()) ||
      f.featureKey.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'enabled' && f.isEnabled) ||
      (filter === 'disabled' && !f.isEnabled);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <Button onClick={() => fetch(`/api/v1/tenants/${tenantId}/features/initialize`, { method: 'POST' }).then(loadFeatures)}>
          Initialize Defaults
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search features..."
          className="flex-1"
        />
        <div className="flex gap-2">
          {(['all', 'enabled', 'disabled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded text-sm capitalize ${filter === f ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Feature List */}
      <div className="space-y-4">
        {filteredFeatures.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            No features found. Click "Initialize Defaults" to set up default features.
          </Card>
        ) : (
          filteredFeatures.map(feature => (
            <Card key={feature.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{feature.featureName}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {feature.featureKey}
                    </span>
                  </div>
                  {feature.config?.description && (
                    <p className="text-gray-500 text-sm mt-1">{feature.config.description}</p>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feature.isEnabled}
                    onChange={() => toggleFeature(feature.featureKey, feature.isEnabled)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {feature.isEnabled && feature.config && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Configuration</h4>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(feature.config, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 flex gap-4 text-sm text-gray-500">
        <span>Total: {features.length}</span>
        <span>Enabled: {features.filter(f => f.isEnabled).length}</span>
        <span>Disabled: {features.filter(f => !f.isEnabled).length}</span>
      </div>
    </div>
  );
};

export default FeatureFlags;
