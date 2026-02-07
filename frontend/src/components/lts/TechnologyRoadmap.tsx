// Technology Roadmap Component - Sprint 49
import React, { useState, useEffect } from 'react';
import ltsService from '../../services/lts.service';

interface TechnologyRoadmapProps {
  tenantId?: string;
}

const TechnologyRoadmap: React.FC<TechnologyRoadmapProps> = ({ tenantId }) => {
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'summary' | 'assessment'>('roadmap');

  useEffect(() => {
    loadRoadmapData();
  }, [tenantId]);

  const loadRoadmapData = async () => {
    setLoading(true);
    try {
      const [roadmapData, summaryData, assessmentData] = await Promise.all([
        ltsService.getRoadmap(),
        ltsService.getRoadmapSummary(),
        ltsService.getTechnologyAssessment(),
      ]);
      setRoadmap(roadmapData);
      setSummary(summaryData);
      setAssessment(assessmentData);
    } catch (err) {
      console.error('Failed to load roadmap data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planned: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      deferred: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      infrastructure: 'bg-purple-100 text-purple-800',
      security: 'bg-red-100 text-red-800',
      ai: 'bg-indigo-100 text-indigo-800',
      frontend: 'bg-pink-100 text-pink-800',
      backend: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100';
  };

  if (loading) {
    return <div className="p-4">Loading roadmap data...</div>;
  }

  return (
    <div className="lts-roadmap p-6">
      <h1 className="mb-6 text-2xl font-bold">Technology Roadmap</h1>

      {/* Assessment Summary */}
      {assessment && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white p-4 text-center shadow">
            <div className="mb-2 text-sm text-gray-500">Overall Score</div>
            <div className="text-4xl font-bold text-blue-600">{assessment.score}</div>
            <div className="text-xs text-gray-400">out of 100</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="mb-3 font-semibold">Category Scores</h3>
            <div className="space-y-2">
              {Object.entries(assessment.categories || {}).map(([cat, data]: [string, any]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{cat}</span>
                  <span className="font-semibold">{data.score}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="mb-3 font-semibold">Top Recommendations</h3>
            <ul className="space-y-1 text-sm">
              {assessment.recommendations?.slice(0, 3).map((rec: any, i: number) => (
                <li key={i}>• {rec.area}: {rec.priority}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex border-b">
        {(['roadmap', 'summary', 'assessment'] as const).map((tab) => (
          <button
            key={tab}
            className={`border-b-2 px-4 py-2 ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'roadmap' && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Effort</th>
                <th className="px-4 py-2 text-left">Target Date</th>
              </tr>
            </thead>
            <tbody>
              {roadmap.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.title}</div>
                    <div className="max-w-xs truncate text-sm text-gray-500">{item.description}</div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-1 text-xs capitalize ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-1 text-xs ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2">{item.priority}</td>
                  <td className="px-4 py-2">{item.estimatedEffort}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {item.targetDate ? new Date(item.targetDate).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'summary' && summary && (
        <div className="grid grid-cols-2 gap-6">
          {/* By Category */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="mb-4 font-semibold">By Category</h3>
            <div className="space-y-3">
              {Object.entries(summary.byCategory || {}).map(([category, data]: [string, any]) => (
                <div key={category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize">{category}</span>
                    <span>{data.count} items</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${(data.count / Math.max(...Object.values(summary.byCategory).map((d: any) => d.count))) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Status */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="mb-4 font-semibold">By Status</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(summary.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <span className={`rounded px-2 py-1 text-xs ${getStatusColor(status)}`}>
                    {status.replace('_', ' ')}
                  </span>
                  <span className="font-semibold">{count as number}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Items */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="mb-4 font-semibold">Upcoming (30 days)</h3>
            <div className="space-y-2">
              {summary.upcomingItems?.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded bg-gray-50 p-2">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-gray-500">
                    {item.targetDate ? new Date(item.targetDate).toLocaleDateString() : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* At Risk Items */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="mb-4 font-semibold text-red-600">At Risk</h3>
            <div className="space-y-2">
              {summary.atRiskItems?.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded bg-red-50 p-2">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-red-600">
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assessment' && assessment && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Technology Assessment</h2>
          <div className="space-y-6">
            {Object.entries(assessment.categories || {}).map(([category, data]: [string, any]) => (
              <div key={category} className="border-b pb-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold capitalize">{category}</h3>
                  <span className="text-2xl font-bold text-blue-600">{data.score}</span>
                </div>
                <div className="mb-3 h-3 w-full rounded-full bg-gray-200">
                  <div
                    className="h-3 rounded-full bg-blue-500"
                    style={{ width: `${data.score}%` }}
                  />
                </div>
                <ul className="space-y-1 text-sm text-gray-600">
                  {data.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnologyRoadmap;
