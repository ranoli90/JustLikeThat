// Performance Optimizer Component - Sprint 48
import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../../services/maintenance.service';

interface PerformanceMetrics {
  serviceName: string;
  cpuUsage: number;
  memoryUsage: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  throughput: number;
  errorRate: number;
}

export const PerformanceOptimizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [performance, setPerformance] = useState<Record<string, PerformanceMetrics>>({});
  const [databaseMetrics, setDatabaseMetrics] = useState<any>(null);
  const [slowQueries, setSlowQueries] = useState<any[]>([]);
  const [loadTests, setLoadTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const services = ['api-gateway', 'user-service', 'job-service', 'matching-service', 'notification-service'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const perfData: Record<string, PerformanceMetrics> = {};
      for (const service of services) {
        const data = await maintenanceService.getCurrentPerformance(service);
        perfData[service] = data;
      }
      setPerformance(perfData);
      
      const [dbMetrics, queries, tests] = await Promise.all([
        maintenanceService.getDatabaseMetrics(),
        maintenanceService.getSlowQueries(),
        maintenanceService.getLoadTestResults(),
      ]);
      setDatabaseMetrics(dbMetrics);
      setSlowQueries(queries);
      setLoadTests(tests);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
    setLoading(false);
  };

  const getHealthColor = (value: number, thresholds: { warning: number; critical: number }): string => {
    if (value >= thresholds.critical) return '#dc2626';
    if (value >= thresholds.warning) return '#ca8a04';
    return '#16a34a';
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Performance Optimizer</h2>

      <div className="tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
        {['overview', 'database', 'slow-queries', 'load-tests'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {Object.entries(performance).map(([service, metrics]) => (
            <div key={service} className="card" style={{ padding: '16px' }}>
              <h4 style={{ margin: '0 0 16px 0', textTransform: 'capitalize' }}>{service.replace('-', ' ')}</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>CPU</p>
                  <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px' }}>
                    <div style={{ height: '8px', borderRadius: '4px', width: `${metrics.cpuUsage}%`, background: getHealthColor(metrics.cpuUsage, { warning: 70, critical: 90 }) }} />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0 0 0' }}>{metrics.cpuUsage.toFixed(1)}%</p>
                </div>
                
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Memory</p>
                  <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px' }}>
                    <div style={{ height: '8px', borderRadius: '4px', width: `${metrics.memoryUsage}%`, background: getHealthColor(metrics.memoryUsage, { warning: 80, critical: 95 }) }} />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0 0 0' }}>{metrics.memoryUsage.toFixed(1)}%</p>
                </div>
                
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>P95 Latency</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{metrics.latencyP95}ms</p>
                </div>
                
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Throughput</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{metrics.throughput}/s</p>
                </div>
                
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Error Rate</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: metrics.errorRate > 1 ? '#dc2626' : '#16a34a' }}>{metrics.errorRate.toFixed(2)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'database' && databaseMetrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <p style={{ color: '#6b7280', margin: '0 0 8px 0' }}>Avg Query Duration</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{databaseMetrics.avgQueryDuration}ms</p>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <p style={{ color: '#6b7280', margin: '0 0 8px 0' }}>Slow Queries</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: databaseMetrics.slowQueries > 10 ? '#dc2626' : '#16a34a' }}>{databaseMetrics.slowQueries}</p>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <p style={{ color: '#6b7280', margin: '0 0 8px 0' }}>Pool Usage</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{databaseMetrics.connectionPoolUsage}%</p>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <p style={{ color: '#6b7280', margin: '0 0 8px 0' }}>Deadlocks</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{databaseMetrics.deadlockCount}</p>
          </div>
        </div>
      )}

      {activeTab === 'slow-queries' && (
        <div className="card" style={{ padding: '16px' }}>
          {slowQueries.map((query, index) => (
            <div key={index} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
              <p style={{ fontFamily: 'monospace', fontSize: '12px', margin: '0 0 8px 0', background: '#f3f4f6', padding: '8px', borderRadius: '4px' }}>{query.query}</p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span><strong>Avg:</strong> {query.avgDuration}ms</span>
                <span><strong>Calls:</strong> {query.callCount}</span>
                <span style={{ color: '#ca8a04' }}><strong>Recommendation:</strong> {query.recommendation}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'load-tests' && (
        <div className="card" style={{ padding: '16px' }}>
          {loadTests.map((test, index) => (
            <div key={index} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{test.testName}</p>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>{test.vusers} VUs for {test.duration}s</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 4px 0' }}><strong>{test.requestsPerSec.toFixed(0)}</strong> req/s</p>
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  background: test.status === 'passed' ? '#16a34a20' : '#dc262620',
                  color: test.status === 'passed' ? '#16a34a' : '#dc2626',
                }}>
                  {test.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PerformanceOptimizer;
