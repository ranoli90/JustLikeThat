import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface IntroRequest {
  id: string;
  targetName: string;
  targetCompany: string;
  mutualConnectionName: string;
  requestType: string;
  status: string;
  createdAt: string;
}

export const WarmIntroRequest: React.FC = () => {
  const [introRequests, setIntroRequests] = useState<IntroRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    targetName: '',
    targetEmail: '',
    targetCompany: '',
    targetJobTitle: '',
    mutualConnectionName: '',
    mutualConnectionEmail: '',
    requestType: 'informational_interview',
    reasonForIntro: '',
    proposedValue: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntroRequests();
  }, []);

  const loadIntroRequests = async () => {
    try {
      const res = await api.get('/api/outreach/intros');
      setIntroRequests(res.data);
    } catch (error) {
      console.error('Failed to load intro requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/outreach/intros', formData);
      setShowForm(false);
      loadIntroRequests();
    } catch (error) {
      console.error('Failed to create intro request:', error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/api/outreach/intros/${id}/status`, { status });
      loadIntroRequests();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'requested':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'accepted':
        return 'bg-green-200 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-4">Loading warm introduction requests...</div>;
  }

  return (
    <div className="warm-intro-manager">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Warm Introduction Requests</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Request Introduction'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded bg-white p-6 shadow">
          <h3 className="mb-4 font-bold">Request a Warm Introduction</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Target Name *</label>
              <input
                type="text"
                className="w-full rounded border p-2"
                value={formData.targetName}
                onChange={(e) => setFormData({ ...formData, targetName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Target Email</label>
              <input
                type="email"
                className="w-full rounded border p-2"
                value={formData.targetEmail}
                onChange={(e) => setFormData({ ...formData, targetEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Target Company *</label>
              <input
                type="text"
                className="w-full rounded border p-2"
                value={formData.targetCompany}
                onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Target Job Title</label>
              <input
                type="text"
                className="w-full rounded border p-2"
                value={formData.targetJobTitle}
                onChange={(e) => setFormData({ ...formData, targetJobTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Mutual Connection Name *</label>
              <input
                type="text"
                className="w-full rounded border p-2"
                value={formData.mutualConnectionName}
                onChange={(e) => setFormData({ ...formData, mutualConnectionName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Mutual Connection Email</label>
              <input
                type="email"
                className="w-full rounded border p-2"
                value={formData.mutualConnectionEmail}
                onChange={(e) => setFormData({ ...formData, mutualConnectionEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Request Type</label>
              <select
                className="w-full rounded border p-2"
                value={formData.requestType}
                onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
              >
                <option value="informational_interview">Informational Interview</option>
                <option value="job_referral">Job Referral</option>
                <option value="career_advice">Career Advice</option>
                <option value="company_insight">Company Insight</option>
                <option value="mentorship">Mentorship</option>
                <option value="general">General Connection</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">Why do you want this introduction? *</label>
            <textarea
              className="w-full rounded border p-2"
              rows={3}
              value={formData.reasonForIntro}
              onChange={(e) => setFormData({ ...formData, reasonForIntro: e.target.value })}
              required
            />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">What value can you provide?</label>
            <textarea
              className="w-full rounded border p-2"
              rows={2}
              value={formData.proposedValue}
              onChange={(e) => setFormData({ ...formData, proposedValue: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary mt-4">
            Submit Request
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {introRequests.map((intro) => (
          <div key={intro.id} className="rounded bg-white p-4 shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold">{intro.targetName}</h3>
                <p className="text-sm text-gray-500">
                  {intro.targetCompany} • {intro.requestType.replace('_', ' ')}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Via: {intro.mutualConnectionName}
                </p>
              </div>
              <div className="text-right">
                <span className={`rounded px-2 py-1 text-sm ${getStatusColor(intro.status)}`}>
                  {intro.status}
                </span>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(intro.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {intro.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => updateStatus(intro.id, 'requested')}
                >
                  Mark as Requested
                </button>
              </div>
            )}
            {intro.status === 'sent' && (
              <div className="mt-3 flex gap-2">
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => updateStatus(intro.id, 'accepted')}
                >
                  Accepted
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => updateStatus(intro.id, 'declined')}
                >
                  Declined
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {introRequests.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          No warm introduction requests yet.
        </div>
      )}
    </div>
  );
};

export default WarmIntroRequest;
