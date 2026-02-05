import React, { useState, useEffect } from 'react';
import { TrainingAPI } from '../../services/maturity.service';

interface TrainingMaterial {
  id: string;
  type: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  status: string;
  category: string;
}

export const TrainingDashboard: React.FC = () => {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', difficulty: '', status: '' });
  const [activeTab, setActiveTab] = useState<'browse' | 'progress'>('browse');

  useEffect(() => {
    loadMaterials();
  }, [filter]);

  const loadMaterials = async () => {
    try {
      const [materialsRes, statsRes] = await Promise.all([
        TrainingAPI.getAll({ limit: 100 }),
        TrainingAPI.getStats(),
      ]);
      setMaterials(materialsRes.data);
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to load training materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const types = ['video', 'lab', 'documentation', 'assessment'];
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const statuses = ['draft', 'published', 'archived'];

  if (loading) return <div className="loading">Loading training dashboard...</div>;

  return (
    <div className="training-dashboard">
      <div className="header">
        <h1>🎓 Training Dashboard</h1>
        <div className="tabs">
          <button
            className={activeTab === 'browse' ? 'active' : ''}
            onClick={() => setActiveTab('browse')}
          >
            Browse Materials
          </button>
          <button
            className={activeTab === 'progress' ? 'active' : ''}
            onClick={() => setActiveTab('progress')}
          >
            My Progress
          </button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Materials</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card">
            <h3>Videos</h3>
            <p>{stats.byType?.video || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Hands-on Labs</h3>
            <p>{stats.byType?.lab || 0}</p>
          </div>
          <div className="stat-card success">
            <h3>Assessments</h3>
            <p>{stats.byType?.assessment || 0}</p>
          </div>
        </div>
      )}

      <div className="filters">
        <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filter.difficulty} onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}>
          <option value="">All Levels</option>
          {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="materials-grid">
        {materials.map(material => (
          <div key={material.id} className="material-card">
            <div className="material-icon">
              {material.type === 'video' ? '🎬' : material.type === 'lab' ? '🧪' : material.type === 'assessment' ? '📝' : '📚'}
            </div>
            <h3>{material.title}</h3>
            <p className="description">{material.description}</p>
            <div className="meta">
              <span className={`badge ${material.type}`}>{material.type}</span>
              <span className={`badge ${material.difficulty}`}>{material.difficulty}</span>
              <span className="duration">⏱ {material.duration} min</span>
            </div>
            <button className="primary">Start Learning</button>
          </div>
        ))}
      </div>
    </div>
  );
};
