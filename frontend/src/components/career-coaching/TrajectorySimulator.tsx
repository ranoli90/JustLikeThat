import React, { useState } from 'react';

interface TimelineEntry {
  year: number;
  role: string;
  salary: number;
  milestones: string[];
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  probability: number;
  timeline: TimelineEntry[];
  risks: { factor: string; likelihood: string; mitigation: string }[];
  opportunities: { factor: string; impact: string }[];
}

interface Projection {
  year: number;
  role: string;
  salary: number;
  growthRate: number;
  confidence: number;
}

interface Simulation {
  id: string;
  currentRole: string;
  targetRole: string;
  simulations: Scenario[];
  projections: Projection[];
  recommendations: any[];
}

export const TrajectorySimulator: React.FC = () => {
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const [formData, setFormData] = useState({
    currentRole: '',
    targetRole: '',
    currentSalary: '',
    experienceYears: 3,
    industry: 'technology',
    location: '',
    skills: '',
  });

  const simulate = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch('/api/v1/career-coaching/trajectory/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          currentSalary: Number(formData.currentSalary),
          skills: formData.skills.split(',').map(s => s.trim()),
        }),
      });

      const data = await response.json();
      setSimulation(data);
      setSelectedScenarios(['moderate']);
    } catch (error) {
      console.error('Error simulating trajectory:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const compareScenarios = async () => {
    if (!simulation || selectedScenarios.length < 2) return;

    try {
      const response = await fetch(`/api/v1/career-coaching/trajectory/${simulation.id}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarios: selectedScenarios }),
      });

      const data = await response.json();
      setComparison(data);
    } catch (error) {
      console.error('Error comparing scenarios:', error);
    }
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(salary);
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.4) return '#10b981';
    if (prob >= 0.2) return '#f59e0b';
    return '#ef4444';
  };

  const scenarios = simulation?.simulations || [];

  return (
    <div className="trajectory-simulator">
      <div className="simulator-header">
        <h2>Career Trajectory Simulator</h2>
        <p>Visualize different career paths and plan your future</p>
      </div>

      {!simulation ? (
        <div className="simulation-form">
          <div className="form-row">
            <div className="form-group">
              <label>Current Role</label>
              <input
                type="text"
                value={formData.currentRole}
                onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                placeholder="e.g., Software Engineer"
              />
            </div>
            <div className="form-group">
              <label>Target Role</label>
              <input
                type="text"
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                placeholder="e.g., Senior Engineer"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Current Salary</label>
              <input
                type="number"
                value={formData.currentSalary}
                onChange={(e) => setFormData({ ...formData, currentSalary: e.target.value })}
                placeholder="e.g., 100000"
              />
            </div>
            <div className="form-group">
              <label>Years of Experience</label>
              <input
                type="number"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                min="0"
                max="30"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              >
                <option value="technology">Technology</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="consulting">Consulting</option>
                <option value="education">Education</option>
                <option value="retail">Retail</option>
                <option value="government">Government</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., San Francisco"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Key Skills (comma-separated)</label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="e.g., JavaScript, React, Node.js"
            />
          </div>

          <button
            onClick={simulate}
            disabled={isSimulating || !formData.currentRole || !formData.targetRole}
          >
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>
      ) : (
        <div className="results-container">
          <div className="results-header">
            <button onClick={() => setSimulation(null)}>← New Simulation</button>
            <h3>{formData.currentRole} → {formData.targetRole}</h3>
          </div>

          <div className="scenarios-grid">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`scenario-card ${selectedScenarios.includes(scenario.id) ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedScenarios(prev =>
                    (prev.includes(scenario.id)
                      ? prev.filter(id => id !== scenario.id)
                      : [...prev, scenario.id])
                  );
                }}
              >
                <div className="scenario-header">
                  <h4>{scenario.name}</h4>
                  <span
                    className="probability"
                    style={{ backgroundColor: getProbabilityColor(scenario.probability) }}
                  >
                    {scenario.probability * 100}% probability
                  </span>
                </div>
                <p className="scenario-description">{scenario.description}</p>

                <div className="scenario-timeline">
                  <h5>Timeline Preview</h5>
                  {scenario.timeline.filter((_, i) => i % 2 === 0).slice(0, 3).map((entry, i) => (
                    <div key={i} className="timeline-entry">
                      <span className="year">Year {entry.year}</span>
                      <span className="role">{entry.role}</span>
                      <span className="salary">{formatSalary(entry.salary)}</span>
                    </div>
                  ))}
                </div>

                <div className="scenario-risks">
                  <span>⚠️ {scenario.risks.length} risks</span>
                  <span>📈 {scenario.opportunities.length} opportunities</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={compareScenarios}
            disabled={selectedScenarios.length < 2}
            className="compare-button"
          >
            Compare Selected Scenarios
          </button>

          {comparison && (
            <div className="comparison-container">
              <h3>Scenario Comparison</h3>
              <div className="comparison-table">
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      {comparison.comparison.map((c: any) => (
                        <th key={c.id}>{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Probability</td>
                      {comparison.comparison.map((c: any) => (
                        <td key={c.id}>{c.probability * 100}%</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Final Salary</td>
                      {comparison.comparison.map((c: any) => (
                        <td key={c.id}>{formatSalary(c.finalSalary || 0)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Risks</td>
                      {comparison.comparison.map((c: any) => (
                        <td key={c.id}>{c.risks}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Opportunities</td>
                      {comparison.comparison.map((c: any) => (
                        <td key={c.id}>{c.opportunities}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="recommendation">
                <h4>Recommended Path</h4>
                <p><strong>{comparison.recommendation?.recommended}</strong></p>
                <p>{comparison.recommendation?.reason}</p>
              </div>
            </div>
          )}

          <div className="projections-chart">
            <h3>Salary Projections</h3>
            <div className="chart-container">
              {simulation.projections.map((projection) => (
                <div key={projection.year} className="projection-bar">
                  <div className="bar-label">Year {projection.year}</div>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{
                        height: `${(projection.salary / 300000) * 100}%`,
                      }}
                    >
                      <span className="bar-value">{formatSalary(projection.salary)}</span>
                    </div>
                  </div>
                  <div className="confidence">
                    {Math.round(projection.confidence * 100)}% confident
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrajectorySimulator;
