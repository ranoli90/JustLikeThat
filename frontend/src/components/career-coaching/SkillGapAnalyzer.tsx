import React, { useState } from 'react';

interface Skill {
  skill: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years: number;
}

interface GapResult {
  gaps: { skill: string; priority: number; category: string; resources: string[] }[];
  strengths: { skill: string; level: string; matchScore: number }[];
  recommendations: { title: string; description: string; priority: number; estimatedTime: string }[];
  confidence: number;
  overallMatchScore: number;
}

export const SkillGapAnalyzer: React.FC = () => {
  const [currentSkills, setCurrentSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newLevel, setNewLevel] = useState<Skill['level']>('intermediate');
  const [newYears, setNewYears] = useState(1);
  const [targetRole, setTargetRole] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<GapResult | null>(null);

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setCurrentSkills([...currentSkills, { skill: newSkill, level: newLevel, years: newYears }]);
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    setCurrentSkills(currentSkills.filter((_, i) => i !== index));
  };

  const analyzeSkills = async () => {
    if (!targetRole || currentSkills.length === 0) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/v1/career-coaching/skill-gap/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSkills,
          targetRole,
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error analyzing skills:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return '#ef4444';
    if (priority >= 5) return '#f59e0b';
    return '#10b981';
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="skill-gap-analyzer">
      <div className="analyzer-header">
        <h2>Skill Gap Analysis</h2>
        <p>Identify your skill gaps and get personalized recommendations</p>
      </div>

      {!results ? (
        <div className="analysis-form">
          <div className="form-section">
            <h3>Target Role</h3>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div className="form-section">
            <h3>Current Skills</h3>
            <div className="skill-input-row">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Skill name"
              />
              <select value={newLevel} onChange={(e) => setNewLevel(e.target.value as Skill['level'])}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <input
                type="number"
                value={newYears}
                onChange={(e) => setNewYears(Number(e.target.value))}
                min="0"
                max="30"
                placeholder="Years"
              />
              <button onClick={addSkill}>Add</button>
            </div>

            <div className="skills-list">
              {currentSkills.map((skill, index) => (
                <div key={index} className="skill-tag">
                  <span className="skill-name">{skill.skill}</span>
                  <span className="skill-level">{skill.level}</span>
                  <span className="skill-years">{skill.years}y</span>
                  <button onClick={() => removeSkill(index)}>×</button>
                </div>
              ))}
            </div>
          </div>

          <button
            className="analyze-button"
            onClick={analyzeSkills}
            disabled={isAnalyzing || !targetRole || currentSkills.length === 0}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Skills'}
          </button>
        </div>
      ) : (
        <div className="results-container">
          <div className="results-header">
            <button onClick={() => setResults(null)} className="back-button">
              ← New Analysis
            </button>
            <div className="match-score">
              <div className="score-circle" style={{ borderColor: getScoreColor(results.overallMatchScore) }}>
                <span>{Math.round(results.overallMatchScore)}%</span>
              </div>
              <p>Role Match Score</p>
            </div>
          </div>

          <div className="results-grid">
            <div className="gaps-section">
              <h3>Skill Gaps</h3>
              <div className="gaps-list">
                {results.gaps.map((gap, index) => (
                  <div key={index} className="gap-card">
                    <div className="gap-header">
                      <span className="gap-skill">{gap.skill}</span>
                      <span
                        className="gap-priority"
                        style={{ backgroundColor: getPriorityColor(gap.priority) }}
                      >
                        Priority: {gap.priority}
                      </span>
                    </div>
                    <span className="gap-category">{gap.category}</span>
                    <div className="gap-resources">
                      <h4>Recommended Resources:</h4>
                      <ul>
                        {gap.resources.map((resource, i) => (
                          <li key={i}>{resource}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="strengths-section">
              <h3>Your Strengths</h3>
              <div className="strengths-list">
                {results.strengths.map((strength, index) => (
                  <div key={index} className="strength-card">
                    <span className="strength-skill">{strength.skill}</span>
                    <span className="strength-level">{strength.level}</span>
                    <div className="match-bar">
                      <div
                        className="match-fill"
                        style={{
                          width: `${strength.matchScore}%`,
                          backgroundColor: getScoreColor(strength.matchScore),
                        }}
                      />
                    </div>
                    <span className="match-percent">{strength.matchScore}% match</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="recommendations-section">
              <h3>Recommendations</h3>
              <div className="recommendations-list">
                {results.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-card">
                    <span className="rec-priority">Priority {rec.priority}</span>
                    <h4>{rec.title}</h4>
                    <p>{rec.description}</p>
                    <span className="rec-time">Estimated: {rec.estimatedTime}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="confidence-note">
            Analysis confidence: {Math.round(results.confidence * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillGapAnalyzer;
