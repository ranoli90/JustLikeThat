import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Checkbox } from './ui/Checkbox';

interface JobSource {
  id: string;
  name: string;
  category: string;
  complianceLevel: string;
  reliability: string;
  costEffectiveness: string;
  isAllowed: boolean;
  isActive: boolean;
  config?: Record<string, any>;
}

interface RateLimitInfo {
  sourceId: string;
  remaining: number;
  limit: number;
  resetTime: number;
}

interface CostInfo {
  sourceId: string;
  creditsUsed: number;
  creditsRemaining: number;
  dailyCost: number;
  monthlyCost: number;
}

export function JobSourceManager() {
  const [sources, setSources] = useState<JobSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [rateLimits, setRateLimits] = useState<Record<string, RateLimitInfo>>({});
  const [costs, setCosts] = useState<Record<string, CostInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
    fetchMonitoringData();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/jobs/sources');
      const data = await response.json();
      setSources(data.data || []);
    } catch (err) {
      setError('Failed to load job sources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonitoringData = async () => {
    try {
      const [rateLimitRes, costRes] = await Promise.all([
        fetch('/api/jobs/rate-limits').then(r => r.json()),
        fetch('/api/jobs/costs').then(r => r.json()),
      ]);
      
      if (rateLimitRes.data) {
        setRateLimits(rateLimitRes.data);
      }
      if (costRes.data) {
        setCosts(costRes.data);
      }
    } catch (err) {
      console.error('Failed to load monitoring data', err);
    }
  };

  const toggleSource = async (sourceId: string, isAllowed: boolean) => {
    try {
      await fetch(`/api/jobs/sources/${sourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAllowed: !isAllowed }),
      });
      fetchSources();
    } catch (err) {
      setError('Failed to update source');
    }
  };

  const availableIntegrations = [
    { id: 'linkedin', name: 'LinkedIn', category: 'API', free: false, auth: true, cost: '$0.05/req' },
    { id: 'indeed', name: 'Indeed', category: 'API', free: false, auth: true, cost: '$0.02/req' },
    { id: 'glassdoor', name: 'Glassdoor', category: 'API', free: false, auth: true, cost: '$0.03/req' },
    { id: 'greenhouse', name: 'Greenhouse', category: 'ATS', free: true, auth: true, cost: 'Free' },
    { id: 'lever', name: 'Lever', category: 'ATS', free: true, auth: true, cost: 'Free' },
    { id: 'workday', name: 'Workday', category: 'ATS', free: false, auth: true, cost: '$0.02/req' },
    { id: 'remote_co', name: 'Remote.co', category: 'Scraper', free: true, auth: false, cost: 'Free' },
    { id: 'we_work_remotely', name: 'We Work Remotely', category: 'Scraper', free: true, auth: false, cost: 'Free' },
    { id: 'angellist', name: 'AngelList', category: 'Startup', free: true, auth: false, cost: 'Free' },
    { id: 'dice', name: 'Dice', category: 'Tech', free: false, auth: true, cost: '$0.04/req' },
    { id: 'techcrunch', name: 'TechCrunch', category: 'Scraper', free: true, auth: false, cost: 'Free' },
  ];

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Job Source Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Cost Overview */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Cost Overview</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">${(Object.values(costs).reduce((acc, c) => acc + c.dailyCost, 0) / 100).toFixed(2)}</p>
            <p className="text-sm text-gray-600">Daily Cost</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">${(Object.values(costs).reduce((acc, c) => acc + c.monthlyCost, 0) / 100).toFixed(2)}</p>
            <p className="text-sm text-gray-600">Monthly Cost</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{sources.filter(s => s.isAllowed).length}</p>
            <p className="text-sm text-gray-600">Active Sources</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{availableIntegrations.length}</p>
            <p className="text-sm text-gray-600">Available Sources</p>
          </div>
        </div>
      </Card>

      {/* Available Integrations */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Available Integrations</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availableIntegrations.map(integration => {
            const source = sources.find(s => s.name.toLowerCase().includes(integration.id.toLowerCase()));
            const isEnabled = source?.isAllowed || false;
            const rateLimit = rateLimits[integration.id];
            
            return (
              <div
                key={integration.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  isEnabled ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => toggleSource(source?.id || integration.id, !isEnabled)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{integration.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    integration.free ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {integration.free ? 'Free' : 'Paid'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Category: {integration.category}</p>
                  <p>Auth: {integration.auth ? 'Required' : 'Not required'}</p>
                  <p>Cost: {integration.cost}</p>
                </div>

                {rateLimit && (
                  <div className="mt-2 text-xs text-gray-500">
                    Rate limit: {rateLimit.remaining}/{rateLimit.limit} remaining
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Source Configuration */}
      {selectedSource && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Configure Source</h2>
          <SourceConfigForm 
            sourceId={selectedSource} 
            onClose={() => setSelectedSource(null)}
          />
        </Card>
      )}

      {/* Rate Limits by Source */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Rate Limits</h2>
        <div className="space-y-2">
          {Object.entries(rateLimits).map(([sourceId, limit]) => (
            <div key={sourceId} className="flex items-center justify-between p-2 border rounded">
              <span className="font-medium">{sourceId}</span>
              <div className="flex items-center space-x-4">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(limit.remaining / limit.limit) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {limit.remaining}/{limit.limit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Compliance Matrix */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Compliance Levels</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-medium text-green-800 mb-2">High Compliance</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• LinkedIn</li>
              <li>• Indeed</li>
              <li>• Greenhouse</li>
              <li>• Lever</li>
              <li>• Workday</li>
            </ul>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-medium text-yellow-800 mb-2">Medium Compliance</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Glassdoor</li>
              <li>• Remote.co</li>
              <li>• AngelList</li>
              <li>• Dice</li>
            </ul>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-medium text-red-800 mb-2">Low Compliance</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Generic Scrapers</li>
              <li>• TechCrunch</li>
              <li>• We Work Remotely</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SourceConfigForm({ sourceId, onClose }: { sourceId: string; onClose: () => void }) {
  const [config, setConfig] = useState<Record<string, any>>({});

  const handleSave = async () => {
    try {
      await fetch(`/api/jobs/sources/${sourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      onClose();
    } catch (err) {
      console.error('Failed to save config', err);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="API Key"
        type="password"
        value={config.apiKey || ''}
        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
        placeholder="Enter API key"
      />
      
      <Input
        label="Client ID"
        value={config.clientId || ''}
        onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
        placeholder="Enter client ID"
      />
      
      <Input
        label="Client Secret"
        type="password"
        value={config.clientSecret || ''}
        onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
        placeholder="Enter client secret"
      />
      
      <div className="flex space-x-2">
        <Button onClick={handleSave}>Save Configuration</Button>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}
