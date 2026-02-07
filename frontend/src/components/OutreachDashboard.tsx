import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  targetCount: number;
  sentCount: number;
  responseCount: number;
  responseRate: number;
}

interface Template {
  id: string;
  name: string;
  category: string;
  usageCount: number;
  successRate: number;
}

interface Analytics {
  campaigns: {
    total: number;
    active: number;
    completed: number;
  };
  contacts: {
    total: number;
    pending: number;
    responded: number;
    connected: number;
  };
  performance: {
    totalSent: number;
    totalResponses: number;
    totalConnections: number;
    responseRate: number;
    successRate: number;
  };
}

export const OutreachDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'templates' | 'recruiters' | 'analytics'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [campaignsRes, templatesRes, analyticsRes] = await Promise.all([
        api.get('/api/outreach/campaigns'),
        api.get('/api/outreach/templates'),
        api.get('/api/outreach/analytics/overview'),
      ]);
      setCampaigns(campaignsRes.data);
      setTemplates(templatesRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to load outreach data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading outreach data...</div>;
  }

  return (
    <div className="outreach-dashboard">
      <div className="header mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employer Outreach & Networking</h1>
        <div className="actions">
          <button
            className="btn btn-primary mr-2"
            onClick={() => setActiveTab('campaigns')}
          >
            New Campaign
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('templates')}
          >
            Manage Templates
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        <nav className="flex space-x-4">
          {(['overview', 'campaigns', 'templates', 'recruiters', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              className={`rounded-md px-4 py-2 font-medium ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="overview-grid mb-6 grid grid-cols-4 gap-4">
          <div className="stat-card rounded bg-white p-4 shadow">
            <h3 className="text-sm text-gray-500">Active Campaigns</h3>
            <p className="text-3xl font-bold">{analytics.campaigns.active}</p>
          </div>
          <div className="stat-card rounded bg-white p-4 shadow">
            <h3 className="text-sm text-gray-500">Total Sent</h3>
            <p className="text-3xl font-bold">{analytics.performance.totalSent}</p>
          </div>
          <div className="stat-card rounded bg-white p-4 shadow">
            <h3 className="text-sm text-gray-500">Response Rate</h3>
            <p className="text-3xl font-bold">{analytics.performance.responseRate}%</p>
          </div>
          <div className="stat-card rounded bg-white p-4 shadow">
            <h3 className="text-sm text-gray-500">Connections Made</h3>
            <p className="text-3xl font-bold">{analytics.performance.totalConnections}</p>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="campaigns-list">
          <table className="w-full rounded bg-white shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-4 text-left">Campaign</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Sent</th>
                <th className="p-4 text-left">Responses</th>
                <th className="p-4 text-left">Rate</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b">
                  <td className="p-4">{campaign.name}</td>
                  <td className="p-4">{campaign.type}</td>
                  <td className="p-4">
                    <span
                      className={`rounded px-2 py-1 text-sm ${
                        campaign.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="p-4">{campaign.sentCount}</td>
                  <td className="p-4">{campaign.responseCount}</td>
                  <td className="p-4">{campaign.responseRate}%</td>
                  <td className="p-4">
                    <button className="mr-2 text-blue-600 hover:underline">Edit</button>
                    <button className="text-green-600 hover:underline">Launch</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="templates-grid grid grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="template-card rounded bg-white p-4 shadow">
              <h3 className="mb-2 font-bold">{template.name}</h3>
              <p className="mb-2 text-sm text-gray-500">{template.category}</p>
              <div className="flex justify-between text-sm">
                <span>Used: {template.usageCount}</span>
                <span>Success: {template.successRate}%</span>
              </div>
              <button className="btn btn-secondary mt-2 w-full text-sm">Edit Template</button>
            </div>
          ))}
          <div className="template-card flex items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50 p-4 shadow">
            <button className="text-gray-500">+ Create Template</button>
          </div>
        </div>
      )}

      {/* Recruiters Tab */}
      {activeTab === 'recruiters' && (
        <RecruiterRelationshipManager />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <OutreachAnalyticsView />
      )}
    </div>
  );
};

// Recruiter Relationship Manager Component
const RecruiterRelationshipManager: React.FC = () => {
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    recruiterName: '',
    recruiterEmail: '',
    company: '',
    specializations: [],
  });

  useEffect(() => {
    loadRecruiters();
  }, []);

  const loadRecruiters = async () => {
    try {
      const res = await api.get('/api/outreach/recruiters');
      setRecruiters(res.data);
    } catch (error) {
      console.error('Failed to load recruiters:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/outreach/recruiters', formData);
      setShowForm(false);
      loadRecruiters();
    } catch (error) {
      console.error('Failed to add recruiter:', error);
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h2 className="text-xl font-bold">Recruiter Relationships</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Recruiter'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 rounded bg-white p-4 shadow">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Recruiter Name"
              className="rounded border p-2"
              value={formData.recruiterName}
              onChange={(e) => setFormData({ ...formData, recruiterName: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              className="rounded border p-2"
              value={formData.recruiterEmail}
              onChange={(e) => setFormData({ ...formData, recruiterEmail: e.target.value })}
            />
            <input
              type="text"
              placeholder="Company"
              className="rounded border p-2"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary mt-4">Save Recruiter</button>
        </form>
      )}

      <div className="grid gap-4">
        {recruiters.map((recruiter) => (
          <div key={recruiter.id} className="rounded bg-white p-4 shadow">
            <div className="flex justify-between">
              <div>
                <h3 className="font-bold">{recruiter.recruiterName}</h3>
                <p className="text-gray-500">{recruiter.company}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">Outreach: {recruiter.outreachCount}</p>
                <p className="text-sm">Response: {recruiter.responseCount}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Outreach Analytics View Component
const OutreachAnalyticsView: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [engagementRes, responseRatesRes] = await Promise.all([
        api.get('/api/outreach/analytics/engagement'),
        api.get('/api/outreach/analytics/response-rates'),
      ]);
      setMetrics({
        engagement: engagementRes.data,
        responseRates: responseRatesRes.data,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Outreach Performance Analytics</h2>
      {metrics && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded bg-white p-4 shadow">
            <h3 className="mb-2 font-bold">Engagement Metrics</h3>
            <p>Total Messages: {metrics.engagement?.summary?.totalMessages}</p>
            <p>Open Rate: {metrics.engagement?.summary?.openRate}%</p>
            <p>Click Rate: {metrics.engagement?.summary?.clickRate}%</p>
            <p>Reply Rate: {metrics.engagement?.summary?.replyRate}%</p>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <h3 className="mb-2 font-bold">Response Rates</h3>
            <p>Total Contacted: {metrics.responseRates?.overall?.totalContacted}</p>
            <p>Total Responded: {metrics.responseRates?.overall?.totalResponded}</p>
            <p>Avg Response Time: {metrics.responseRates?.overall?.avgFirstResponseTimeHours} hours</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutreachDashboard;
