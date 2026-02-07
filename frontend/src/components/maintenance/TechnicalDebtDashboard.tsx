// Technical Debt Dashboard Component - Sprint 48
import React, { useState, useEffect } from 'react';
import { maintenanceService, TechnicalDebtItem, DebtSummary } from '../../services/maintenance.service';

interface QualityMetrics {
  serviceName: string;
  coverage: number;
  complexity: number;
  duplication: number;
  securityRating: string;
  maintainability: number;
  technicalDebt: number;
}

export const TechnicalDebtDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [debtItems, setDebtItems] = useState<TechnicalDebtItem[]>([]);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [metrics, setMetrics] = useState<QualityMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    status: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [debtRes, summaryRes, metricsRes] = await Promise.all([
        maintenanceService.getTechnicalDebt(),
        maintenanceService.getDebtSummary(),
        maintenanceService.getQualityMetrics(),
      ]);
      setDebtItems(debtRes);
      setSummary(summaryRes);
      setMetrics(metricsRes);
    } catch (error) {
      console.error('Failed to load technical debt data:', error);
    }
    setLoading(false);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'in_progress': return '#2563eb';
      case 'planned': return '#ca8a04';
      case 'accepted': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'code': return '📝';
      case 'database': return '🗄️';
      case 'security': return '🔒';
      case 'performance': return '⚡';
      default: return '📋';
    }
  };

  const filteredItems = debtItems.filter(item => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.severity && item.severity !== filters.severity) return false;
    if (filters.status && item.status !== filters.status) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading technical debt data...</p>
      </div>
    );
  }

  return (
    <div className="technical-debt-dashboard" style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Technical Debt Dashboard</h2>
      
      <div className="tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '2px solid #2563eb' : '2px solid transparent',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'overview' ? 'bold' : 'normal',
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('debt-list')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'debt-list' ? '2px solid #2563eb' : '2px solid transparent',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'debt-list' ? 'bold' : 'normal',
          }}
        >
          Debt Items
        </button>
        <button
          onClick={() => setActiveTab('quality-metrics')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'quality-metrics' ? '2px solid #2563eb' : '2px solid transparent',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'quality-metrics' ? 'bold' : 'normal',
          }}
        >
          Quality Metrics
        </button>
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280' }}>Total Debt Items</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{summary?.totalItems || 0}</p>
          </div>
          
          <div className="card" style={{ padding: '16px' }}>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280' }}>Reduction Progress</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{summary?.reductionPercentage.toFixed(1) || 0}%</p>
            <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px', marginTop: '8px' }}>
              <div style={{ background: '#2563eb', height: '8px', borderRadius: '4px', width: `${summary?.reductionPercentage || 0}%` }} />
            </div>
          </div>
          
          <div className="card" style={{ padding: '16px' }}>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280' }}>Est. Hours to Address</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{summary?.estimatedHoursTotal.toFixed(1) || 0}h</p>
          </div>
          
          <div className="card" style={{ padding: '16px' }}>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280' }}>Critical Issues</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#dc2626' }}>{summary?.bySeverity?.critical || 0}</p>
          </div>
        </div>
      )}

      {activeTab === 'debt-list' && (
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="">All Categories</option>
              <option value="code">Code</option>
              <option value="database">Database</option>
              <option value="security">Security</option>
              <option value="performance">Performance</option>
            </select>
            
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="">All Statuses</option>
              <option value="identified">Identified</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>

          <div className="debt-list">
            {filteredItems.map((item) => (
              <div key={item.id} className="card" style={{ marginBottom: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '20px' }}>{getCategoryIcon(item.category)}</span>
                    <div>
                      <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{item.description}</p>
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0' }}>{item.filePath}</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          background: `${getSeverityColor(item.severity)  }20`,
                          color: getSeverityColor(item.severity)
                        }}>
                          {item.severity}
                        </span>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          background: `${getStatusColor(item.status)  }20`,
                          color: getStatusColor(item.status)
                        }}>
                          {item.status.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>~{item.estimatedHours}h</span>
                      </div>
                    </div>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: '#f3f4f6' }}>
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'quality-metrics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {metrics.map((metric) => (
            <div key={metric.serviceName} className="card" style={{ padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0' }}>{metric.serviceName}</h4>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>Coverage</span>
                  <span style={{ fontWeight: 'bold' }}>{metric.coverage.toFixed(1)}%</span>
                </div>
                <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px' }}>
                  <div style={{ 
                    background: metric.coverage >= 85 ? '#16a34a' : metric.coverage >= 70 ? '#ca8a04' : '#dc2626',
                    height: '8px', 
                    borderRadius: '4px', 
                    width: `${metric.coverage}%` 
                  }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>Complexity</span>
                <span style={{ fontWeight: 'bold' }}>{metric.complexity.toFixed(1)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>Duplication</span>
                <span style={{ fontWeight: 'bold' }}>{metric.duplication.toFixed(1)}%</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>Security Rating</span>
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  background: metric.securityRating === 'A' ? '#16a34a20' : metric.securityRating === 'B' ? '#ca8a0420' : '#dc262620',
                  color: metric.securityRating === 'A' ? '#16a34a' : metric.securityRating === 'B' ? '#ca8a04' : '#dc2626',
                  fontWeight: 'bold'
                }}>
                  {metric.securityRating}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px' }}>Technical Debt</span>
                <span style={{ fontWeight: 'bold' }}>{metric.technicalDebt.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicalDebtDashboard;
