import React, { useState, useMemo } from 'react';
import { CohortConfig, RetentionData } from '../../types/analytics';

interface CohortAnalysisProps {
  cohorts: CohortConfig[];
  onCompare: (cohortIds: string[]) => void;
}

export const CohortAnalysis: React.FC<CohortAnalysisProps> = ({ cohorts, onCompare }) => {
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const toggleCohortSelection = (cohortId: string) => {
    setSelectedCohorts((prev) =>
      prev.includes(cohortId)
        ? prev.filter((id) => id !== cohortId)
        : [...prev, cohortId]
    );
  };

  const averageRetention = useMemo(() => {
    if (cohorts.length === 0) return 0;
    const total = cohorts.reduce((sum, c) => {
      const day7 = c.retentionData.find((r) => r.period === 7);
      return sum + (day7?.retainedPct || 0);
    }, 0);
    return total / cohorts.length;
  }, [cohorts]);

  const renderRetentionTable = () => (
    <div className="cohort-table-container">
      <table className="cohort-table">
        <thead>
          <tr>
            <th>Cohort</th>
            <th>Size</th>
            {[1, 7, 14, 30, 60, 90].map((day) => (
              <th key={day}>Day {day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <tr key={cohort.id} className={selectedCohorts.includes(cohort.id) ? 'selected' : ''}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedCohorts.includes(cohort.id)}
                  onChange={() => toggleCohortSelection(cohort.id)}
                />
                <span className="cohort-name">{cohort.name}</span>
              </td>
              <td>{cohort.cohortSize}</td>
              {([1, 7, 14, 30, 60, 90] as const).map((day) => {
                const data = cohort.retentionData.find((r) => r.period === day);
                const pct = data?.retainedPct || 0;
                const color = getRetentionColor(pct);
                return (
                  <td key={day} style={{ backgroundColor: color }}>
                    {data ? `${pct.toFixed(1)}%` : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderRetentionChart = () => (
    <div className="cohort-chart">
      <svg viewBox="0 0 800 400" className="retention-svg">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <line
            key={pct}
            x1="50"
            y1={400 - pct * 3.5}
            x2="750"
            y2={400 - pct * 3.5}
            stroke="#e0e0e0"
            strokeDasharray="4"
          />
        ))}

        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <text
            key={pct}
            x="40"
            y={400 - pct * 3.5 + 4}
            textAnchor="end"
            className="axis-label"
          >
            {pct}%
          </text>
        ))}

        {/* X-axis labels */}
        {[1, 7, 14, 30, 60, 90].map((day, i) => (
          <text
            key={day}
            x={100 + i * 120}
            y="420"
            textAnchor="middle"
            className="axis-label"
          >
            Day {day}
          </text>
          ))}

        {/* Cohort lines */}
        {selectedCohorts.map((cohortId, index) => {
          const cohort = cohorts.find((c) => c.id === cohortId);
          if (!cohort) return null;

          const points = cohort.retentionData
            .filter((r) => [1, 7, 14, 30, 60, 90].includes(r.period))
            .map((r, i) => ({
              x: 100 + i * 120,
              y: 400 - r.retainedPct * 3.5,
            }));

          const colors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#9c27b0', '#ff5722'];
          const strokeColor = colors[index % colors.length];

          return (
            <g key={cohortId}>
              <polyline
                points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
              />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill={strokeColor}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {selectedCohorts.length > 0 && (
        <div className="chart-legend">
          {selectedCohorts.map((cohortId, index) => {
            const cohort = cohorts.find((c) => c.id === cohortId);
            const colors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#9c27b0', '#ff5722'];
            return (
              <div key={cohortId} className="legend-item">
                <span
                  className="legend-color"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span>{cohort?.name || 'Unknown'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="cohort-analysis">
      <div className="cohort-header">
        <h3>Cohort Analysis</h3>
        <div className="cohort-stats">
          <div className="stat">
            <span className="stat-label">Total Cohorts</span>
            <span className="stat-value">{cohorts.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Avg Day 7 Retention</span>
            <span className="stat-value">{averageRetention.toFixed(1)}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">Selected</span>
            <span className="stat-value">{selectedCohorts.length}</span>
          </div>
        </div>
      </div>

      <div className="cohort-controls">
        <div className="view-toggle">
          <button
            className={viewMode === 'table' ? 'active' : ''}
            onClick={() => setViewMode('table')}
          >
            Table
          </button>
          <button
            className={viewMode === 'chart' ? 'active' : ''}
            onClick={() => setViewMode('chart')}
          >
            Chart
          </button>
        </div>

        <button
          className="btn-primary"
          disabled={selectedCohorts.length < 2}
          onClick={() => onCompare(selectedCohorts)}
        >
          Compare Selected
        </button>
      </div>

      {viewMode === 'table' ? renderRetentionTable() : renderRetentionChart()}

      <div className="cohort-insights">
        <h4>Insights</h4>
        <ul>
          <li>Best performing cohort: <strong>{getBestPerformingCohort(cohorts)}</strong></li>
          <li>Average churn rate: <strong>{getAverageChurn(cohorts)}%</strong></li>
          <li>Recommended retention period: <strong>7 days</strong></li>
        </ul>
      </div>
    </div>
  );
};

const getRetentionColor = (pct: number): string => {
  if (pct >= 75) return 'rgba(52, 168, 83, 0.2)';
  if (pct >= 50) return 'rgba(251, 188, 4, 0.2)';
  if (pct >= 25) return 'rgba(234, 67, 53, 0.2)';
  return 'rgba(234, 67, 53, 0.4)';
};

const getBestPerformingCohort = (cohorts: CohortConfig[]): string => {
  if (cohorts.length === 0) return 'N/A';
  let best = cohorts[0];
  for (const cohort of cohorts) {
    const day7 = cohort.retentionData.find((r) => r.period === 7);
    const bestDay7 = best.retentionData.find((r) => r.period === 7);
    if (day7 && bestDay7 && day7.retainedPct > bestDay7.retainedPct) {
      best = cohort;
    }
  }
  return best.name;
};

const getAverageChurn = (cohorts: CohortConfig[]): string => {
  if (cohorts.length === 0) return '0';
  const total = cohorts.reduce((sum, c) => {
    const day30 = c.retentionData.find((r) => r.period === 30);
    return sum + (day30?.churnedPct || 0);
  }, 0);
  return (total / cohorts.length).toFixed(1);
};

export default CohortAnalysis;
