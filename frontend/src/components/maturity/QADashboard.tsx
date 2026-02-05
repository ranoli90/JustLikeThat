import React, { useState, useEffect } from 'react';
import { QAAPI } from '../../services/maturity.service';

interface QAReport {
  id: string;
  releaseId: string;
  testType: string;
  status: string;
  coverage: number;
  executedBy: string;
  executedAt: string;
  issues: any[];
}

export const QADashboard: React.FC = () => {
  const [reports, setReports] = useState<QAReport[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ testType: '', status: '' });
  const [selectedReport, setSelectedReport] = useState<QAReport | null>(null);

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    try {
      const [reportsRes, statsRes] = await Promise.all([
        QAAPI.getReports({ limit: 50 }),
        QAAPI.getStats(),
      ]);
      setReports(reportsRes.data);
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to load QA reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTests = async (suiteId: string, environment: string) => {
    try {
      await QAAPI.executeTests({ suiteId, environment });
      alert('Test execution started!');
      loadReports();
    } catch (error) {
      console.error('Failed to execute tests:', error);
    }
  };

  const testTypes = ['functional', 'performance', 'security', 'accessibility', 'uat'];
  const statuses = ['passed', 'failed', 'blocked', 'in_progress'];

  if (loading) return <div className="loading">Loading QA dashboard...</div>;

  return (
    <div className="qa-dashboard">
      <div className="header">
        <h1>🧪 Quality Assurance Dashboard</h1>
        <div className="actions">
          <button className="primary" onClick={() => handleExecuteTests('default', 'staging')}>
            Run All Tests
          </button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Reports</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card success">
            <h3>Passed</h3>
            <p>{stats.passed || 0}</p>
          </div>
          <div className="stat-card danger">
            <h3>Failed</h3>
            <p>{stats.failed || 0}</p>
          </div>
          <div className="stat-card warning">
            <h3>Blocked</h3>
            <p>{stats.blocked || 0}</p>
          </div>
        </div>
      )}

      <div className="test-suites">
        <h2>Test Suites</h2>
        <div className="suite-grid">
          <div className="suite-card">
            <h3>🔧 Functional Tests</h3>
            <p>Core functionality validation</p>
            <button onClick={() => handleExecuteTests('functional', 'staging')}>Run Suite</button>
          </div>
          <div className="suite-card">
            <h3>⚡ Performance Tests</h3>
            <p>Load and stress testing</p>
            <button onClick={() => handleExecuteTests('performance', 'staging')}>Run Suite</button>
          </div>
          <div className="suite-card">
            <h3>🔒 Security Tests</h3>
            <p>Vulnerability scanning</p>
            <button onClick={() => handleExecuteTests('security', 'staging')}>Run Suite</button>
          </div>
          <div className="suite-card">
            <h3>♿ Accessibility Tests</h3>
            <p>WCAG 2.1 compliance</p>
            <button onClick={() => handleExecuteTests('accessibility', 'staging')}>Run Suite</button>
          </div>
        </div>
      </div>

      <div className="filters">
        <select value={filter.testType} onChange={(e) => setFilter({ ...filter, testType: e.target.value })}>
          <option value="">All Test Types</option>
          {testTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="reports-list">
        <h2>Recent Reports</h2>
        {reports.map(report => (
          <div
            key={report.id}
            className={`report-card ${selectedReport?.id === report.id ? 'selected' : ''}`}
            onClick={() => setSelectedReport(report)}
          >
            <div className="report-header">
              <span className={`badge ${report.testType}`}>{report.testType}</span>
              <span className={`badge ${report.status}`}>{report.status}</span>
              <span className="coverage">{report.coverage}% coverage</span>
            </div>
            <div className="report-meta">
              <span>By: {report.executedBy}</span>
              <span>{new Date(report.executedAt).toLocaleString()}</span>
            </div>
            <div className="issues-summary">
              <span className="open">Open: {report.issues?.length || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedReport && (
        <div className="report-details">
          <h3>Report Details</h3>
          <div className="detail-grid">
            <div><strong>Test Type:</strong> {selectedReport.testType}</div>
            <div><strong>Status:</strong> {selectedReport.status}</div>
            <div><strong>Coverage:</strong> {selectedReport.coverage}%</div>
            <div><strong>Executed By:</strong> {selectedReport.executedBy}</div>
            <div><strong>Date:</strong> {new Date(selectedReport.executedAt).toLocaleString()}</div>
          </div>
          {selectedReport.issues && selectedReport.issues.length > 0 && (
            <div className="issues-list">
              <h4>Issues Found</h4>
              {selectedReport.issues.map((issue: any, idx: number) => (
                <div key={idx} className="issue-item">
                  <span className={`severity ${issue.severity}`}>{issue.severity}</span>
                  <span className="message">{issue.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
