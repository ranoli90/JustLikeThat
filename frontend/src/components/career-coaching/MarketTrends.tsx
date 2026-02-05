import React, { useState, useEffect } from 'react';

interface Trend {
  category: string;
  name: string;
  data: any;
  forecast: any[];
  trend: 'rising' | 'stable' | 'declining';
  confidence: number;
}

interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  trend: string;
  recommendations?: string[];
}

export const MarketTrends: React.FC = () => {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('skill');
  const [searchQuery, setSearchQuery] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrends = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/v1/career-coaching/trends?category=${selectedCategory}`
      );
      const data = await response.json();
      setTrends(data);
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [selectedCategory]);

  const createAlert = async (type: string, criteria: any) => {
    try {
      const response = await fetch('/api/v1/career-coaching/trends/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, criteria }),
      });

      const data = await response.json();
      setAlerts([...alerts, data]);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising': return '#10b981';
      case 'declining': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredTrends = trends.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="market-trends">
      <div className="trends-header">
        <h2>Job Market Trends</h2>
        <p>Stay updated with the latest market insights and opportunities</p>
      </div>

      <div className="trends-filters">
        <div className="category-tabs">
          <button
            className={selectedCategory === 'skill' ? 'active' : ''}
            onClick={() => setSelectedCategory('skill')}
          >
            Skills
          </button>
          <button
            className={selectedCategory === 'role' ? 'active' : ''}
            onClick={() => setSelectedCategory('role')}
          >
            Roles
          </button>
          <button
            className={selectedCategory === 'industry' ? 'active' : ''}
            onClick={() => setSelectedCategory('industry')}
          >
            Industries
          </button>
          <button
            className={selectedCategory === 'salary' ? 'active' : ''}
            onClick={() => setSelectedCategory('salary')}
          >
            Salaries
          </button>
        </div>

        <div className="search-box">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${selectedCategory} trends...`}
          />
        </div>
      </div>

      <div className="trends-content">
        <div className="trends-list">
          {isLoading ? (
            <div className="loading">Loading trends...</div>
          ) : (
            filteredTrends.map((trend, index) => (
              <div
                key={index}
                className={`trend-card ${selectedTrend === trend ? 'selected' : ''}`}
                onClick={() => setSelectedTrend(trend)}
              >
                <div className="trend-header">
                  <span className="trend-name">{trend.name}</span>
                  <span
                    className="trend-indicator"
                    style={{ color: getTrendColor(trend.trend) }}
                  >
                    {getTrendIcon(trend.trend)} {trend.trend}
                  </span>
                </div>
                <div className="trend-meta">
                  <span>Confidence: {Math.round(trend.confidence * 100)}%</span>
                </div>
                <button
                  className="create-alert-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    createAlert(selectedCategory, { [selectedCategory]: trend.name });
                  }}
                >
                  🔔 Alert
                </button>
              </div>
            ))
          )}
        </div>

        <div className="trend-details">
          {selectedTrend ? (
            <div className="detail-container">
              <h3>{selectedTrend.name}</h3>
              <div className="trend-badge" style={{ backgroundColor: getTrendColor(selectedTrend.trend) }}>
                {selectedTrend.trend.toUpperCase()}
              </div>

              <div className="data-section">
                <h4>Current Data</h4>
                <div className="data-grid">
                  {Object.entries(selectedTrend.data).map(([key, value]) => (
                    <div key={key} className="data-item">
                      <span className="data-label">{key}</span>
                      <span className="data-value">
                        {typeof value === 'number' && (key.includes('salary') || key.includes('growth') || key.includes('demand'))
                          ? key.includes('salary')
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value as number)
                            : `${((value as number) * 100).toFixed(1)}%`
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="forecast-section">
                <h4>5-Year Forecast</h4>
                <div className="forecast-chart">
                  {selectedTrend.forecast?.map((entry: any, i: number) => (
                    <div key={i} className="forecast-bar">
                      <span className="forecast-year">Year {entry.year}</span>
                      <div className="forecast-bar-container">
                        <div
                          className="forecast-bar-fill"
                          style={{
                            height: selectedCategory === 'salary'
                              ? `${(entry.entry / 200000) * 100}%`
                              : `${(entry.growth || entry.value || 0.5) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="forecast-value">
                        {selectedCategory === 'salary'
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 0,
                            }).format(entry.entry || 0)
                          : `${((entry.growth || entry.value || 0) * 100).toFixed(1)}%`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="insights-section">
                <h4>Key Insights</h4>
                <ul>
                  <li>High demand in {selectedCategory === 'skill' ? 'tech and finance sectors' : 'growing industries'}</li>
                  <li>Salary growth potential of {((selectedTrend.data.growth || selectedTrend.data.salaryImpact || 0) * 100).toFixed(0)}%</li>
                  <li>Recommended skill level: {selectedCategory === 'skill' ? 'intermediate to advanced' : 'varies by role'}</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>Select a trend to view detailed analysis</p>
            </div>
          )}
        </div>
      </div>

      <div className="alerts-section">
        <h3>Your Alerts</h3>
        {alerts.length === 0 ? (
          <p className="no-alerts">No alerts set. Create alerts to stay informed.</p>
        ) : (
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-card ${alert.severity}`}>
                <span className="alert-type">{alert.type}</span>
                <h4>{alert.title}</h4>
                <p>{alert.description}</p>
                <button onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))}>
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketTrends;
