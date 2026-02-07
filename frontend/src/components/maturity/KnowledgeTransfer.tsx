import React, { useState, useEffect } from 'react';
import { KnowledgeTransferAPI } from '../../services/maturity.service';
import { ConfirmModal } from '../modals/ConfirmModal';
import { PromptModal } from '../modals/PromptModal';

interface KnowledgeTransfer {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  scheduledDate?: string;
  completedAt?: string;
  attendees?: string[];
  materials?: string[];
}

export const KnowledgeTransferDashboard: React.FC = () => {
  const [items, setItems] = useState<KnowledgeTransfer[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<KnowledgeTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '' });
  const [selectedItem, setSelectedItem] = useState<KnowledgeTransfer | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [scheduleItemId, setScheduleItemId] = useState<string | null>(null);
  const [cancelItemId, setCancelItemId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const [itemsRes, statsRes, upcomingRes] = await Promise.all([
        KnowledgeTransferAPI.getAll({ limit: 50 }),
        KnowledgeTransferAPI.getStats(),
        KnowledgeTransferAPI.getUpcoming(5),
      ]);
      setItems(itemsRes.data);
      setStats(statsRes);
      setUpcoming(upcomingRes);
    } catch (error) {
      console.error('Failed to load knowledge transfer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (id: string) => {
    setScheduleItemId(id);
    setShowScheduleModal(true);
  };

  const confirmSchedule = async (date: string) => {
    setShowScheduleModal(false);
    if (date && scheduleItemId) {
      try {
        await KnowledgeTransferAPI.schedule(scheduleItemId, { date: new Date(date).toISOString() });
        console.log('Knowledge transfer scheduled successfully!');
        loadData();
      } catch (error) {
        console.error('Failed to schedule knowledge transfer:', error);
      }
    }
    setScheduleItemId(null);
  };

  const handleComplete = async (id: string) => {
    try {
      await KnowledgeTransferAPI.complete(id);
      console.log('Knowledge transfer marked as completed!');
      loadData();
    } catch (error) {
      console.error('Failed to complete knowledge transfer:', error);
    }
  };

  const handleCancel = async (id: string) => {
    setCancelItemId(id);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    setShowCancelModal(false);
    if (cancelItemId) {
      try {
        await KnowledgeTransferAPI.cancel(cancelItemId);
        console.log('Knowledge transfer cancelled!');
        loadData();
      } catch (error) {
        console.error('Failed to cancel knowledge transfer:', error);
      }
    }
    setCancelItemId(null);
  };

  const types = ['workshop', 'session', 'demo', 'handover', 'training', 'documentation'];
  const statuses = ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'];

  if (loading) return <div className="loading">Loading knowledge transfer dashboard...</div>;

  return (
    <div className="knowledge-transfer">
      <div className="header">
        <h1>📚 Knowledge Transfer Dashboard</h1>
        <button className="primary">+ New Knowledge Transfer</button>
      </div>

      {upcoming.length > 0 && (
        <div className="upcoming-section">
          <h2>📅 Upcoming Sessions</h2>
          <div className="upcoming-list">
            {upcoming.map(item => (
              <div key={item.id} className="upcoming-card">
                <div className="date">
                  {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : 'TBD'}
                </div>
                <div className="info">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
                <span className={`badge ${item.type}`}>{item.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Sessions</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card success">
            <h3>Completed</h3>
            <p>{stats.completed || 0}</p>
          </div>
          <div className="stat-card warning">
            <h3>Scheduled</h3>
            <p>{stats.scheduled || 0}</p>
          </div>
          <div className="stat-card info">
            <h3>In Progress</h3>
            <p>{stats.inProgress || 0}</p>
          </div>
        </div>
      )}

      <div className="filters">
        <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="items-grid">
        {items.map(item => (
          <div
            key={item.id}
            className={`kt-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
            onClick={() => setSelectedItem(item)}
          >
            <div className="kt-header">
              <span className={`badge ${item.type}`}>{item.type}</span>
              <span className={`badge ${item.status}`}>{item.status}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="kt-meta">
              {item.scheduledDate && (
                <span>📅 {new Date(item.scheduledDate).toLocaleDateString()}</span>
              )}
              {item.completedAt && (
                <span>✅ Completed: {new Date(item.completedAt).toLocaleDateString()}</span>
              )}
            </div>
            <div className="kt-actions">
              {item.status === 'draft' && (
                <button onClick={(e) => { e.stopPropagation(); handleSchedule(item.id); }}>Schedule</button>
              )}
              {item.status === 'scheduled' && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); handleComplete(item.id); }}>Mark Complete</button>
                  <button onClick={(e) => { e.stopPropagation(); handleCancel(item.id); }} className="danger">Cancel</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="kt-details">
          <h3>Knowledge Transfer Details</h3>
          <div className="detail-grid">
            <div><strong>Type:</strong> {selectedItem.type}</div>
            <div><strong>Status:</strong> {selectedItem.status}</div>
            <div><strong>Title:</strong> {selectedItem.title}</div>
            <div><strong>Description:</strong> {selectedItem.description}</div>
            {selectedItem.scheduledDate && (
              <div><strong>Scheduled:</strong> {new Date(selectedItem.scheduledDate).toLocaleString()}</div>
            )}
            {selectedItem.completedAt && (
              <div><strong>Completed:</strong> {new Date(selectedItem.completedAt).toLocaleString()}</div>
            )}
          </div>
          {selectedItem.materials && selectedItem.materials.length > 0 && (
            <div className="materials-list">
              <h4>Materials</h4>
              <ul>
                {selectedItem.materials.map((mat, idx) => (
                  <li key={idx}>{mat}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <PromptModal
        isOpen={showScheduleModal}
        title="Schedule Knowledge Transfer"
        message="Enter scheduled date (ISO format):"
        defaultValue=""
        onConfirm={confirmSchedule}
        onCancel={() => {
          setShowScheduleModal(false);
          setScheduleItemId(null);
        }}
      />

      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Knowledge Transfer"
        message="Are you sure you want to cancel this knowledge transfer?"
        onConfirm={confirmCancel}
        onCancel={() => {
          setShowCancelModal(false);
          setCancelItemId(null);
        }}
      />
    </div>
  );
};
