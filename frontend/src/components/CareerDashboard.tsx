import React, { useState, useEffect } from 'react';

interface CareerDashboardData {
  activeGoals: number;
  completedGoals: number;
  milestonesInProgress: number;
  completedMilestones: number;
  activeSkillGaps: number;
  closedSkillGaps: number;
  activeMentorships: number;
  upcomingMilestones: CareerMilestone[];
  recentGoals: CareerGoal[];
}

interface CareerMilestone {
  id: string;
  title: string;
  type: string;
  status: string;
  targetDate?: string;
  progressPercentage: number;
}

interface CareerGoal {
  id: string;
  title: string;
  timeframe: string;
  status: string;
  priority: string;
  progressPercentage: number;
  targetDate?: string;
}

interface SkillGap {
  id: string;
  skillName: string;
  category: string;
  currentLevel: string;
  requiredLevel: string;
  gapScore: number;
  isPriority: boolean;
}

interface LearningResource {
  id: string;
  title: string;
  type: string;
  provider: string;
  estimatedHours: number;
  difficulty: string;
  skills: string[];
  status: string;
}

interface SalaryProjection {
  role: string;
  minSalary: number;
  medianSalary: number;
  maxSalary: number;
  growthRate: number;
  projectedSalary: number;
}

interface IndustryTrend {
  id: string;
  name: string;
  type: string;
  direction: string;
  demandScore: number;
  growthRate: number;
}

export const CareerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'goals' | 'skill-gap' | 'learning' | 'salary' | 'trends' | 'mentorship'>('dashboard');
  const [dashboard, setDashboard] = useState<CareerDashboardData | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [learningResources, setLearningResources] = useState<LearningResource[]>([]);
  const [salaryProjections, setSalaryProjections] = useState<SalaryProjection[]>([]);
  const [trends, setTrends] = useState<IndustryTrend[]>([]);
  const [loading, setLoading] = useState(false);

  const userId = 'demo-user';

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      setDashboard({
        activeGoals: 4,
        completedGoals: 12,
        milestonesInProgress: 3,
        completedMilestones: 28,
        activeSkillGaps: 8,
        closedSkillGaps: 15,
        activeMentorships: 1,
        upcomingMilestones: [
          { id: '1', title: 'Complete AWS Certification', type: 'CERTIFICATION', status: 'in_progress', targetDate: '2024-03-15', progressPercentage: 60 },
          { id: '2', title: 'Master System Design', type: 'SKILL_MASTERY', status: 'pending', targetDate: '2024-04-01', progressPercentage: 30 },
          { id: '3', title: 'Lead a Team Project', type: 'PROJECT_COMPLETION', status: 'pending', targetDate: '2024-05-01', progressPercentage: 0 },
        ],
        recentGoals: [
          { id: '1', title: 'Become Senior Engineer', timeframe: 'long_term', status: 'active', priority: 'high', progressPercentage: 45, targetDate: '2024-12-31' },
          { id: '2', title: 'Get AWS Solutions Architect', timeframe: 'short_term', status: 'on_track', priority: 'high', progressPercentage: 60 },
        ],
      });

      setSkillGaps([
        { id: '1', skillName: 'System Design', category: 'technical', currentLevel: 'intermediate', requiredLevel: 'advanced', gapScore: 66, isPriority: true },
        { id: '2', skillName: 'Leadership', category: 'leadership', currentLevel: 'beginner', requiredLevel: 'intermediate', gapScore: 66, isPriority: true },
        { id: '3', skillName: 'AWS', category: 'technical', currentLevel: 'intermediate', requiredLevel: 'advanced', gapScore: 50, isPriority: true },
        { id: '4', skillName: 'Communication', category: 'soft', currentLevel: 'intermediate', requiredLevel: 'advanced', gapScore: 50, isPriority: false },
      ]);

      setLearningResources([
        { id: '1', title: 'AWS Solutions Architect Course', type: 'course', provider: 'A Cloud Guru', estimatedHours: 40, difficulty: 'advanced', skills: ['AWS', 'Cloud Architecture'], status: 'in_progress' },
        { id: '2', title: 'System Design Primer', type: 'book', provider: 'Grokking the System Design', estimatedHours: 20, difficulty: 'advanced', skills: ['System Design', 'Distributed Systems'], status: 'not_started' },
        { id: '3', title: 'Leadership Fundamentals', type: 'course', provider: 'LinkedIn Learning', estimatedHours: 15, difficulty: 'intermediate', skills: ['Leadership', 'Team Management'], status: 'in_progress' },
      ]);

      setSalaryProjections([
        { role: 'Software Engineer', minSalary: 100000, medianSalary: 140000, maxSalary: 180000, growthRate: 5, projectedSalary: 176000 },
        { role: 'Senior Software Engineer', minSalary: 140000, medianSalary: 180000, maxSalary: 220000, growthRate: 4, projectedSalary: 216000 },
        { role: 'Staff Engineer', minSalary: 180000, medianSalary: 220000, maxSalary: 280000, growthRate: 3, projectedSalary: 256000 },
      ]);

      setTrends([
        { id: '1', name: 'AI/ML Engineering', type: 'skill', direction: 'rising', demandScore: 95, growthRate: 25 },
        { id: '2', name: 'Cloud Architecture', type: 'skill', direction: 'rising', demandScore: 88, growthRate: 15 },
        { id: '3', name: 'DevOps', type: 'skill', direction: 'stable', demandScore: 82, growthRate: 5 },
        { id: '4', name: 'Data Engineering', type: 'skill', direction: 'rising', demandScore: 90, growthRate: 18 },
        { id: '5', name: 'Cybersecurity', type: 'skill', direction: 'rising', demandScore: 85, growthRate: 12 },
      ]);
    } catch (error) {
      console.error('Failed to load career dashboard:', error);
    }
    setLoading(false);
  };

  return (
    <div className="career-dashboard-container">
      <h1>Career Development Dashboard</h1>
      
      <div className="tab-navigation">
        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button className={activeTab === 'goals' ? 'active' : ''} onClick={() => setActiveTab('goals')}>Career Goals</button>
        <button className={activeTab === 'skill-gap' ? 'active' : ''} onClick={() => setActiveTab('skill-gap')}>Skill Gap Analysis</button>
        <button className={activeTab === 'learning' ? 'active' : ''} onClick={() => setActiveTab('learning')}>Learning Resources</button>
        <button className={activeTab === 'salary' ? 'active' : ''} onClick={() => setActiveTab('salary')}>Salary Projections</button>
        <button className={activeTab === 'trends' ? 'active' : ''} onClick={() => setActiveTab('trends')}>Industry Trends</button>
        <button className={activeTab === 'mentorship' ? 'active' : ''} onClick={() => setActiveTab('mentorship')}>Mentorship</button>
      </div>

      {activeTab === 'dashboard' && dashboard && (
        <div className="dashboard-tab">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Active Goals</h3>
              <p className="stat-value">{dashboard.activeGoals}</p>
              <span className="stat-label">{dashboard.completedGoals} completed</span>
            </div>
            <div className="stat-card">
              <h3>Milestones</h3>
              <p className="stat-value">{dashboard.milestonesInProgress}</p>
              <span className="stat-label">{dashboard.completedMilestones} achieved</span>
            </div>
            <div className="stat-card">
              <h3>Skill Gaps</h3>
              <p className="stat-value">{dashboard.activeSkillGaps}</p>
              <span className="stat-label">{dashboard.closedSkillGaps} closed</span>
            </div>
            <div className="stat-card">
              <h3>Mentorships</h3>
              <p className="stat-value">{dashboard.activeMentorships}</p>
              <span className="stat-label">active relationship</span>
            </div>
          </div>

          <div className="section">
            <h2>Upcoming Milestones</h2>
            <div className="milestones-list">
              {dashboard.upcomingMilestones.map((milestone) => (
                <div key={milestone.id} className="milestone-card">
                  <div className="milestone-header">
                    <h4>{milestone.title}</h4>
                    <span className={`status-badge ${milestone.status}`}>{milestone.status}</span>
                  </div>
                  <div className="milestone-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${milestone.progressPercentage}%` }} />
                    </div>
                    <span>{milestone.progressPercentage}%</span>
                  </div>
                  {milestone.targetDate && <p className="target-date">Target: {new Date(milestone.targetDate).toLocaleDateString()}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'skill-gap' && (
        <div className="skill-gap-tab">
          <h2>Skill Gap Analysis</h2>
          <div className="skill-gaps-grid">
            {skillGaps.map((gap) => (
              <div key={gap.id} className={`skill-gap-card ${gap.isPriority ? 'priority' : ''}`}>
                <div className="skill-header">
                  <h4>{gap.skillName}</h4>
                  {gap.isPriority && <span className="priority-badge">Priority</span>}
                </div>
                <div className="skill-levels">
                  <div className="level current">
                    <span className="label">Current:</span>
                    <span className="value">{gap.currentLevel}</span>
                  </div>
                  <div className="level required">
                    <span className="label">Required:</span>
                    <span className="value">{gap.requiredLevel}</span>
                  </div>
                </div>
                <div className="gap-score">
                  <span>Gap Score:</span>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${gap.gapScore}%` }} />
                  </div>
                  <span>{gap.gapScore}%</span>
                </div>
                <span className={`category-badge ${gap.category}`}>{gap.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'learning' && (
        <div className="learning-tab">
          <h2>Learning Resources</h2>
          <div className="resources-grid">
            {learningResources.map((resource) => (
              <div key={resource.id} className="resource-card">
                <div className="resource-header">
                  <h4>{resource.title}</h4>
                  <span className={`status-badge ${resource.status}`}>{resource.status.replace('_', ' ')}</span>
                </div>
                <p className="provider">{resource.provider}</p>
                <div className="resource-meta">
                  <span className="type">{resource.type}</span>
                  <span className="hours">{resource.estimatedHours}h</span>
                  <span className={`difficulty ${resource.difficulty}`}>{resource.difficulty}</span>
                </div>
                <div className="skills-list">
                  {resource.skills.map((skill, i) => <span key={i} className="skill-tag">{skill}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'salary' && (
        <div className="salary-tab">
          <h2>Salary Projections</h2>
          <div className="salary-grid">
            {salaryProjections.map((projection, i) => (
              <div key={i} className="salary-card">
                <h4>{projection.role}</h4>
                <div className="salary-range">
                  <span className="min">${projection.minSalary.toLocaleString()}</span>
                  <span className="median">${projection.medianSalary.toLocaleString()}</span>
                  <span className="max">${projection.maxSalary.toLocaleString()}</span>
                </div>
                <div className="growth-info">
                  <span className="growth-rate">{projection.growthRate}% annual growth</span>
                  <span className="projected">5yr: ${projection.projectedSalary.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="trends-tab">
          <h2>Industry Trends</h2>
          <div className="trends-grid">
            {trends.map((trend) => (
              <div key={trend.id} className="trend-card">
                <div className="trend-header">
                  <h4>{trend.name}</h4>
                  <span className={`direction-badge ${trend.direction}`}>{trend.direction}</span>
                </div>
                <div className="trend-stats">
                  <div className="stat">
                    <span className="label">Demand Score</span>
                    <span className="value">{trend.demandScore}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Growth Rate</span>
                    <span className="value">+{trend.growthRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'mentorship' && (
        <div className="mentorship-tab">
          <h2>Mentorship</h2>
          <div className="mentorship-section">
            <button className="find-mentor-btn">Find a Mentor</button>
            <div className="active-mentorships">
              <h3>Active Mentorships</h3>
              <div className="mentorship-card">
                <h4>John Smith</h4>
                <p className="title">Senior Staff Engineer at Google</p>
                <p className="focus">Focus: System Design & Leadership</p>
                <div className="meetings">
                  <span>8 meetings completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .career-dashboard-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .tab-navigation {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .tab-navigation button {
          padding: 10px 20px;
          border: none;
          background: #f0f0f0;
          cursor: pointer;
          border-radius: 5px;
          transition: all 0.2s;
        }
        .tab-navigation button.active {
          background: #4CAF50;
          color: white;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          text-align: center;
        }
        .stat-value {
          font-size: 48px;
          font-weight: bold;
          color: #4CAF50;
          margin: 10px 0;
        }
        .section {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        .milestones-list, .goals-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .milestone-card, .goal-card {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 8px;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          text-transform: uppercase;
        }
        .status-badge.in_progress { background: #fff3e0; color: #ef6c00; }
        .status-badge.pending { background: #e3f2fd; color: #1976d2; }
        .status-badge.active { background: #e8f5e9; color: #2e7d32; }
        .progress-bar {
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #4CAF50;
          border-radius: 4px;
        }
        .skill-gaps-grid, .resources-grid, .salary-grid, .trends-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .skill-gap-card, .resource-card, .salary-card, .trend-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .skill-gap-card.priority {
          border: 2px solid #ff5722;
        }
        .skill-levels {
          display: flex;
          justify-content: space-between;
          margin: 15px 0;
        }
        .gap-score {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 15px 0;
        }
        .score-bar {
          flex: 1;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }
        .score-fill {
          height: 100%;
          background: #ff5722;
          border-radius: 4px;
        }
        .category-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .category-badge.technical { background: #e3f2fd; color: #1976d2; }
        .category-badge.leadership { background: #fce4ec; color: #c2185b; }
        .resource-meta {
          display: flex;
          gap: 10px;
          margin: 10px 0;
          font-size: 12px;
        }
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 10px;
        }
        .skill-tag {
          background: #f5f5f5;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .salary-range {
          display: flex;
          justify-content: space-between;
          margin: 15px 0;
          font-weight: bold;
        }
        .salary-range .median { color: #4CAF50; }
        .growth-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }
        .direction-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .direction-badge.rising { background: #e8f5e9; color: #2e7d32; }
        .direction-badge.stable { background: #fff3e0; color: #ef6c00; }
        .trend-stats {
          display: flex;
          gap: 20px;
          margin-top: 15px;
        }
        .find-mentor-btn {
          padding: 12px 24px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }
        .mentorship-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default CareerDashboard;
