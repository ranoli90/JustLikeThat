import React, { useState, useEffect } from 'react';

interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  version: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'CANCELLED';
  trigger: string;
  input: Record<string, any>;
  output: Record<string, any> | null;
  error: Record<string, any> | null;
  startedAt: string;
  completedAt: string | null;
  executionTime: number | null;
}

interface ExecutionHistoryProps {
  workflowId?: string;
  onSelectExecution?: (executionId: string) => void;
}

const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({
  workflowId,
  onSelectExecution,
}) => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);

  useEffect(() => {
    fetchExecutions();
  }, [workflowId, page, filter]);

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual API
      const mockExecutions: Execution[] = [
        {
          id: 'exec-1',
          workflowId: 'wf-1',
          workflowName: 'Email Notification Workflow',
          version: 1,
          status: 'COMPLETED',
          trigger: 'WEBHOOK',
          input: { email: 'test@example.com' },
          output: { sent: true, messageId: 'msg-123' },
          error: null,
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          completedAt: new Date(Date.now() - 3500000).toISOString(),
          executionTime: 100,
        },
        {
          id: 'exec-2',
          workflowId: 'wf-1',
          workflowName: 'Email Notification Workflow',
          version: 1,
          status: 'FAILED',
          trigger: 'SCHEDULE',
          input: {},
          output: null,
          error: { code: 'SMTP_ERROR', message: 'Failed to send email' },
          startedAt: new Date(Date.now() - 7200000).toISOString(),
          completedAt: new Date(Date.now() - 7190000).toISOString(),
          executionTime: 10000,
        },
        {
          id: 'exec-3',
          workflowId: 'wf-2',
          workflowName: 'Data Processing Pipeline',
          version: 2,
          status: 'RUNNING',
          trigger: 'MANUAL',
          input: { fileId: 'file-456' },
          output: null,
          error: null,
          startedAt: new Date(Date.now() - 60000).toISOString(),
          completedAt: null,
          executionTime: null,
        },
      ];

      let filtered = mockExecutions;
      if (workflowId) {
        filtered = filtered.filter(e => e.workflowId === workflowId);
      }
      if (filter !== 'ALL') {
        filtered = filtered.filter(e => e.status === filter);
      }

      setExecutions(filtered);
      setTotalPages(Math.ceil(filtered.length / 10));
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Execution['status']) => {
    switch (status) {
      case 'COMPLETED': return '#10B981';
      case 'FAILED': return '#EF4444';
      case 'RUNNING': return '#3B82F6';
      case 'PENDING': return '#F59E0B';
      case 'PAUSED': return '#6B7280';
      case 'CANCELLED': return '#9CA3AF';
      default: return '#6B7280';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="execution-history" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Execution History</h2>
        
        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          <option value="ALL">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="RUNNING">Running</option>
          <option value="PENDING">Pending</option>
          <option value="PAUSED">Paused</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
          Loading executions...
        </div>
      )}

      {/* Executions List */}
      {!loading && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {executions.map((execution) => (
              <div
                key={execution.id}
                onClick={() => {
                  setSelectedExecution(execution.id);
                  onSelectExecution?.(execution.id);
                }}
                style={{
                  padding: '12px 16px',
                  backgroundColor: selectedExecution === execution.id ? '#EFF6FF' : 'white',
                  border: `1px solid ${selectedExecution === execution.id ? '#3B82F6' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      {execution.workflowName}
                      <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '8px' }}>
                        v{execution.version}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      Trigger: {execution.trigger} • Started: {formatDate(execution.startedAt)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        backgroundColor: getStatusColor(execution.status),
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 500,
                      }}
                    >
                      {execution.status}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6B7280', minWidth: '60px', textAlign: 'right' }}>
                      {formatDuration(execution.executionTime)}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedExecution === execution.id && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
                          Input
                        </h4>
                        <pre style={{ fontSize: '11px', backgroundColor: '#F3F4F6', padding: '8px', borderRadius: '4px', overflow: 'auto' }}>
                          {JSON.stringify(execution.input, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
                          Output
                        </h4>
                        {execution.output ? (
                          <pre style={{ fontSize: '11px', backgroundColor: '#F3F4F6', padding: '8px', borderRadius: '4px', overflow: 'auto' }}>
                            {JSON.stringify(execution.output, null, 2)}
                          </pre>
                        ) : execution.error ? (
                          <pre style={{ fontSize: '11px', backgroundColor: '#FEE2E2', padding: '8px', borderRadius: '4px', overflow: 'auto', color: '#991B1B' }}>
                            {JSON.stringify(execution.error, null, 2)}
                          </pre>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>-</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      {execution.status === 'FAILED' && (
                        <button
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Retry
                        </button>
                      )}
                      {(execution.status === 'RUNNING' || execution.status === 'PENDING') && (
                        <button
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
                          Cancel
                        </button>
                      )}
                      <button
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#F3F4F6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 12px',
                  backgroundColor: page === 1 ? '#F3F4F6' : 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                }}
              >
                Previous
              </button>
              <span style={{ padding: '8px 12px', fontSize: '13px' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 12px',
                  backgroundColor: page === totalPages ? '#F3F4F6' : 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExecutionHistory;
