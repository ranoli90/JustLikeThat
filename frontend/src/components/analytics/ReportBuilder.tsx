import React, { useState } from 'react';
import { ReportConfig, ReportSchedule } from '../../types/analytics';

interface ReportBuilderProps {
  report?: ReportConfig;
  templates: any[];
  onSave: (report: Partial<ReportConfig>) => void;
  onCancel: () => void;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  report,
  templates,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(report?.name || '');
  const [description, setDescription] = useState(report?.description || '');
  const [selectedTemplate, setSelectedTemplate] = useState(report?.config?.template || '');
  const [metrics, setMetrics] = useState<string[]>(report?.config?.metrics || []);
  const [dateRange, setDateRange] = useState({
    start: report?.config?.dateRange?.start || '30d',
    end: 'now',
  });
  const [schedule, setSchedule] = useState<ReportSchedule | undefined>(
    report?.schedule
  );
  const [activeTab, setActiveTab] = useState<'content' | 'schedule' | 'delivery'>('content');

  const AVAILABLE_METRICS = [
    { id: 'page_views', name: 'Page Views', category: 'Engagement' },
    { id: 'sessions', name: 'Sessions', category: 'Engagement' },
    { id: 'users', name: 'Unique Users', category: 'Engagement' },
    { id: 'bounce_rate', name: 'Bounce Rate', category: 'Engagement' },
    { id: 'conversion_rate', name: 'Conversion Rate', category: 'Conversion' },
    { id: 'revenue', name: 'Revenue', category: 'Revenue' },
    { id: 'ltv', name: 'Lifetime Value', category: 'Revenue' },
    { id: 'churn_rate', name: 'Churn Rate', category: 'Retention' },
    { id: 'retention_d7', name: 'Day 7 Retention', category: 'Retention' },
    { id: 'retention_d30', name: 'Day 30 Retention', category: 'Retention' },
  ];

  const toggleMetric = (metricId: string) => {
    setMetrics((prev) =>
      (prev.includes(metricId)
        ? prev.filter((m) => m !== metricId)
        : [...prev, metricId])
    );
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      type: schedule ? 'scheduled' : 'custom',
      config: {
        template: selectedTemplate,
        metrics,
        dateRange: { start: dateRange.start, end: dateRange.end },
      },
      schedule,
    });
  };

  const categories = [...new Set(AVAILABLE_METRICS.map((m) => m.category))];

  return (
    <div className="report-builder">
      <div className="builder-header">
        <h3>{report ? 'Edit Report' : 'Create New Report'}</h3>
        <div className="builder-actions">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            {report ? 'Update Report' : 'Create Report'}
          </button>
        </div>
      </div>

      <div className="builder-form">
        <div className="form-group">
          <label>Report Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter report name"
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter report description"
          />
        </div>

        <div className="tabs">
          <button
            className={activeTab === 'content' ? 'active' : ''}
            onClick={() => setActiveTab('content')}
          >
            Content
          </button>
          <button
            className={activeTab === 'schedule' ? 'active' : ''}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule
          </button>
          <button
            className={activeTab === 'delivery' ? 'active' : ''}
            onClick={() => setActiveTab('delivery')}
          >
            Delivery
          </button>
        </div>

        {activeTab === 'content' && (
          <div className="tab-content">
            <div className="form-section">
              <h4>Report Template</h4>
              <div className="template-grid">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <h5>{template.name}</h5>
                    <p>{template.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h4>Metrics</h4>
              {categories.map((category) => (
                <div key={category} className="metric-category">
                  <h5>{category}</h5>
                  <div className="metric-grid">
                    {AVAILABLE_METRICS.filter((m) => m.category === category).map((metric) => (
                      <label key={metric.id} className="metric-checkbox">
                        <input
                          type="checkbox"
                          checked={metrics.includes(metric.id)}
                          onChange={() => toggleMetric(metric.id)}
                        />
                        <span>{metric.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="form-section">
              <h4>Date Range</h4>
              <div className="date-range">
                <select
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="14d">Last 14 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="365d">Last year</option>
                </select>
                <span>to</span>
                <select
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                >
                  <option value="now">Now</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="tab-content">
            <div className="form-section">
              <h4>Schedule Type</h4>
              <div className="schedule-options">
                <label className="schedule-option">
                  <input
                    type="radio"
                    checked={!schedule}
                    onChange={() => setSchedule(undefined)}
                  />
                  <span>One-time report</span>
                </label>
                <label className="schedule-option">
                  <input
                    type="radio"
                    checked={!!schedule}
                    onChange={() =>
                      setSchedule({
                        frequency: 'weekly',
                        time: '09:00',
                        timezone: 'UTC',
                      })
                    }
                  />
                  <span>Recurring report</span>
                </label>
              </div>
            </div>

            {schedule && (
              <>
                <div className="form-section">
                  <h4>Frequency</h4>
                  <select
                    value={schedule.frequency}
                    onChange={(e) =>
                      setSchedule({ ...schedule, frequency: e.target.value as ReportSchedule['frequency'] })
                    }
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {schedule.frequency === 'weekly' && (
                  <div className="form-section">
                    <h4>Day of Week</h4>
                    <div className="day-selector">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                        <button
                          key={day}
                          className={schedule.dayOfWeek === i ? 'selected' : ''}
                          onClick={() => setSchedule({ ...schedule, dayOfWeek: i })}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {schedule.frequency === 'monthly' && (
                  <div className="form-section">
                    <h4>Day of Month</h4>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      value={schedule.dayOfMonth || 1}
                      onChange={(e) =>
                        setSchedule({ ...schedule, dayOfMonth: parseInt(e.target.value, 10) })
                      }
                    />
                  </div>
                )}

                <div className="form-section">
                  <h4>Time</h4>
                  <input
                    type="time"
                    value={schedule.time}
                    onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                  />
                  <select
                    value={schedule.timezone}
                    onChange={(e) => setSchedule({ ...schedule, timezone: e.target.value })}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="tab-content">
            <div className="form-section">
              <h4>Export Format</h4>
              <div className="format-options">
                <label className="format-option">
                  <input type="checkbox" defaultChecked />
                  <span>PDF</span>
                </label>
                <label className="format-option">
                  <input type="checkbox" defaultChecked />
                  <span>Excel</span>
                </label>
                <label className="format-option">
                  <input type="checkbox" />
                  <span>CSV</span>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h4>Email Recipients</h4>
              <textarea
                placeholder="Enter email addresses (one per line)"
                rows={4}
              />
              <p className="help-text">Reports will be sent to these addresses</p>
            </div>

            <div className="form-section">
              <h4>Share Link</h4>
              <div className="share-link">
                <input type="text" value="https://app.example.com/reports/..." readOnly />
                <button>Copy Link</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportBuilder;
