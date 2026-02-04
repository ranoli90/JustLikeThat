import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Insider {
  id: string;
  company: string;
  insiderName: string;
  insiderLinkedIn: string;
  relationship: string;
  status: string;
  department: string;
  jobTitle: string;
}

export const CompanyInsiderTracker: React.FC = () => {
  const [insiders, setInsiders] = useState<Insider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedInsider, setSelectedInsider] = useState<Insider | null>(null);
  const [formData, setFormData] = useState({
    company: '',
    insiderName: '',
    insiderLinkedIn: '',
    relationship: 'random_connection',
    department: '',
    jobTitle: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsiders();
  }, []);

  const loadInsiders = async () => {
    try {
      const res = await api.get('/api/outreach/insiders');
      setInsiders(res.data);
    } catch (error) {
      console.error('Failed to load insiders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/outreach/insiders', formData);
      setShowForm(false);
      loadInsiders();
    } catch (error) {
      console.error('Failed to add insider:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading company insiders...</div>;
  }

  return (
    <div className="company-insider-tracker">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Company Insider Connections</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Insider'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6">
          <h3 className="font-bold mb-4">Add Company Insider</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company *</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Insider Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={formData.insiderName}
                onChange={(e) => setFormData({ ...formData, insiderName: e.target.value })}
              />
            </div>
            <div>
              <label text-sm font-medium className="block mb-1">LinkedIn URL</label>
              <input
                type="url"
                className="w-full border p-2 rounded"
                value={formData.insiderLinkedIn}
                onChange={(e) => setFormData({ ...formData, insiderLinkedIn: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Relationship</label>
              <select
                className="w-full border p-2 rounded"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              >
                <option value="random_connection">Random Connection</option>
                <option value="current_employee">Current Employee</option>
                <option value="former_employee">Former Employee</option>
                <option value="friend">Friend</option>
                <option value="family">Family</option>
                <option value="alumni">Alumni</option>
              </select>
            </div>
          </div>
          <button type="submit" className="mt-4 btn btn-primary">Add Insider</button>
        </form>
      )}

      <div className="grid gap-4">
        {insiders.map((insider) => (
          <div
            key={insider.id}
            className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-md"
            onClick={() => setSelectedInsider(insider)}
          >
            <h3 className="font-bold">{insider.company}</h3>
            <p className="text-gray-600">{insider.insiderName}</p>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{insider.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyInsiderTracker;
