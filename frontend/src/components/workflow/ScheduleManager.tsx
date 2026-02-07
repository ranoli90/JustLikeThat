import React, { useState } from 'react';
import { ConfirmModal } from '../modals/ConfirmModal';

interface ScheduledWorkflow {
  id: string;
  workflowId: string;
  workflowName: string;
  cronExpression: string;
  timezone: string;
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'FAILED';
  lastRun: string | null;
  nextRun: string;
  priority: number;
  totalRuns: number;
  failedRuns: number;
}

interface ScheduleManagerProps {
  workflowId?: string;
  onScheduleChange?: () => void;
}

const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  workflowId,
  onScheduleChange,
}) => {
  const [schedules, setSchedules] = useState<ScheduledWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    cronExpression: '* * * * *',
    timezone: 'UTC',
    priority: 5,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null);

  useState(() => {
    fetchSchedules();
  });

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockSchedules: ScheduledWorkflow[] = [
        {
          id: 'sched-1',
          workflowId: 'wf-1',
          workflowName: 'Email Notification Workflow',
          cronExpression: '0 9 * * *',
          timezone: 'America/New_York',
          status: 'ACTIVE',
          lastRun: new Date(Date.now() - 86400000).toISOString(),
          nextRun: new Date(Date.now() + 43200000).toISOString(),
          priority: 5,
          totalRuns: 30,
          failedRuns: 0,
        },
        {
          id: 'sched-2',
          workflowId: 'wf-2',
          workflowName: 'Data Processing Pipeline',
          cronExpression: '0 */4 * * *',
          timezone: 'UTC',
          status: 'PAUSED',
          lastRun: new Date(Date.now() - 172800000).toISOString(),
          nextRun: new Date(Date.now() + 3600000).toISOString(),
          priority: 3,
          totalRuns: 180,
          failedRuns: 2,
        },
      ];

      const filtered = mockSchedules;
      if (workflowId) {
        filtered = filtered.filter(s => s.workflowId === workflowId);
      }

      setSchedules(filtered);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ScheduledWorkflow['status']) => {
    switch (status) {
      case 'ACTIVE': return '#10B981';
      case 'PAUSED': return '#F59E0B';
      case 'DISABLED': return '#6B7280';
      case 'FAILED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatNextRun = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    if (diff < 60000) return 'In < 1 minute';
    if (diff < 3600000) return `In ${Math.floor(diff / 60000)} minutes`;
    if (diff < 86400000) return `In ${Math.floor(diff / 3600000)} hours`;
    return date.toLocaleString();
  };

  const handleToggleStatus = async (scheduleId: string, newStatus: ScheduledWorkflow['status']) => {
    // API call to update status
    setSchedules(schedules.map(s => 
      (s.id === scheduleId ? { ...s, status: newStatus } : s)
    ));
  };

  const handleDelete = async (scheduleId: string) => {
    setDeleteScheduleId(scheduleId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    if (deleteScheduleId) {
      setSchedules(schedules.filter(s => s.id !== deleteScheduleId));
    }
    setDeleteScheduleId(null);
  };

  const cronPresets = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every day at 9am', value: '0 9 * * *' },
    { label: 'Every week (Monday 9am)', value: '0 9 * * 1' },
    { label: 'Every month (1st at 9am)', value: '0 9 1 * *' },
    { label: 'Every 15 minutes', value: '*/15 * * * *' },
  ];

  return (
    <div className="schedule-manager" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          Scheduled Workflows
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          + Add Schedule
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
          Loading schedules...
        </div>
      ) : schedules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
          No scheduled workflows. Create one to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              style={{
                padding: '16px',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                    {schedule.workflowName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                    <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>
                      {schedule.cronExpression}
                    </code>
                    <span style={{ marginLeft: '8px' }}>• {schedule.timezone}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    Priority: {schedule.priority} • Runs: {schedule.totalRuns} ({schedule.failedRuns} failed)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      backgroundColor: getStatusColor(schedule.status),
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 500,
                    }}
                  >
                    {schedule.status}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6B7280', minWidth: '120px', textAlign: 'right' }}>
                    Next: {formatNextRun(schedule.nextRun)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                {schedule.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handleToggleStatus(schedule.id, 'PAUSED')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#F59E0B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(schedule.id, 'ACTIVE')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => handleDelete(schedule.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '500px',
              padding: '20px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              Create Schedule
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                Cron Expression
              </label>
              <input
                type="text"
                value={newSchedule.cronExpression}
                onChange={(e) => setNewSchedule({ ...newSchedule, cronExpression: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              />
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6B7280', marginRight: '8px' }}>Presets:</span>
                {cronPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setNewSchedule({ ...newSchedule, cronExpression: preset.value })}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: newSchedule.cronExpression === preset.value ? '#3B82F6' : '#F3F4F6',
                      color: newSchedule.cronExpression === preset.value ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      marginRight: '4px',
                      marginBottom: '4px',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                Timezone
              </label>
              <select
                value={newSchedule.timezone}
                onChange={(e) => setNewSchedule({ ...newSchedule, timezone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                Priority (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={newSchedule.priority}
                onChange={(e) => setNewSchedule({ ...newSchedule, priority: parseInt(e.target.value, 10) })}
                style={{ width: '100%' }}
              />
              <div style={{ textAlign: 'center', fontSize: '13px', color: '#6B7280' }}>
                {newSchedule.priority}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Create schedule API call
                  setShowCreateModal(false);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule?"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteScheduleId(null);
        }}
      />
    </div>
  );
};

export default ScheduleManager;
