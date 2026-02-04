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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Warm Introduction Requests</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Request Introduction'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6">
          <h3 className="font-bold mb-4">Request a Warm Introduction</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Target Name *</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={formData.targetName}
                onChange={(e) => setFormData({ ...formData, targetName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Email</label>
              <input
                type="email"
                className="w-full border p-2 rounded"
                value={formData.targetEmail}
                onChange={(e) => setFormData({ ...formData, targetEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Company *</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={formData.targetCompany}
                onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Job Title</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={formData.targetJobTitle}
                onChange={(e) => setFormData({ ...formData, targetJobTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mutual Connection Name *</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={formData.mutualConnectionName}
                onChange={(e) => setFormData({ ...formData, mutualConnectionName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mutual Connection Email</label>
              <input
                type="email"
                className="w-full border p-2 rounded"
                value={formData.mutualConnectionEmail}
                onChange={(e) => setFormData({ ...formData, mutualConnectionEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Request Type</label>
              <select
                className="w-full border p-2 rounded"
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
            <label className="block text-sm font-medium mb-1">Why do you want this introduction? *</label>
            <textarea
              className="w-full border p-2 rounded"
              rows={3}
              value={formData.reasonForIntro}
              onChange={(e) => setFormData({ ...formData, reasonForIntro: e.target.value })}
              required
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">What value can you provide?</label>
            <textarea
              className="w-full border p-2 rounded"
              rows={2}
              value={formData.proposedValue}
              onChange={(e) => setFormData({ ...formData, proposedValue: e.target.value })}
            />
          </div>
          <button type="submit" className="mt-4 btn btn-primary">
            Submit Request
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {introRequests.map((intro) => (
          <div key={intro.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{intro.targetName}</h3>
                <p className="text-gray-500 text-sm">
                  {intro.targetCompany} • {intro.requestType.replace('_', ' ')}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Via: {intro.mutualConnectionName}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(intro.status)}`}>
                  {intro.status}
                </span>
                <p className="text-xs text-gray-400 mt-1">
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
        <div className="text-center py-8 text-gray-500">
          No warm introduction requests yet.
        </div>
      )}
    </div>
  );
};

export default WarmIntroRequest;
