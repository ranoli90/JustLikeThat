import React, { useState, useEffect } from 'react';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  completedAt?: string;
}

interface Goal {
  id: string;
  title: string;
  targetDate: string;
  milestones: Milestone[];
  progress: number;
  status: 'active' | 'achieved' | 'abandoned';
  createdAt: string;
}

interface Progress {
  totalGoals: number;
  activeGoals: number;
  achievedGoals: number;
  abandonedGoals: number;
  averageProgress: number;
  achievementRate: number;
  upcomingDeadlines: {
    id: string;
    title: string;
    targetDate: string;
    progress: number;
    daysRemaining: number;
  }[];
}

export const GoalTracker: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    targetDate: '',
  });

  useEffect(() => {
    fetchGoals();
    fetchProgress();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/v1/career-coaching/goals');
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/v1/career-coaching/goals/progress');
      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const createGoal = async () => {
    if (!formData.title || !formData.targetDate) return;

    try {
      const response = await fetch('/api/v1/career-coaching/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setGoals([...goals, data]);
      setFormData({ title: '', targetDate: '' });
      setShowForm(false);
      fetchProgress();
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const updateMilestone = async (goalId: string, milestoneId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/v1/career-coaching/goals/${goalId}/milestone/${milestoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });

      const data = await response.json();
      setGoals(goals.map(g => g.id === goalId ? data : g));
      fetchProgress();
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      await fetch(`/api/v1/career-coaching/goals/${goalId}`, {
        method: 'DELETE',
      });
      setGoals(goals.filter(g => g.id !== goalId));
      fetchProgress();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return '#10b981';
    if (progress >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="goal-tracker">
      <div className="tracker-header">
        <h2>Career Goal Tracker</h2>
        <p>Set, track, and achieve your career goals</p>
      </div>

      {progress && (
        <div className="progress-overview">
          <div className="progress-card">
            <div className="progress-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" className="progress-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="progress-fill"
                  style={{
                    strokeDasharray: `${(progress.achievementRate / 100) * 283} 283`,
                  }}
                />
              </svg>
              <span className="progress-text">{progress.achievementRate}%</span>
            </div>
            <p>Achievement Rate</p>
          </div>

          <div className="progress-stats">
            <div className="stat">
              <span className="stat-value">{progress.activeGoals}</span>
              <span className="stat-label">Active Goals</span>
            </div>
            <div className="stat">
              <span className="stat-value">{progress.achievedGoals}</span>
              <span className="stat-label">Achieved</span>
            </div>
            <div className="stat">
              <span className="stat-value">{Math.round(progress.averageProgress)}%</span>
              <span className="stat-label">Avg Progress</span>
            </div>
          </div>

          {progress.upcomingDeadlines.length > 0 && (
            <div className="upcoming-deadlines">
              <h4>Upcoming Deadlines</h4>
              {progress.upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="deadline-item">
                  <span className="deadline-title">{deadline.title}</span>
                  <span className="deadline-days">
                    {deadline.daysRemaining} days left
                  </span>
                  <div className="deadline-progress">
                    <div className="deadline-bar">
                      <div
                        className="deadline-fill"
                        style={{ width: `${deadline.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="goals-section">
        <div className="section-header">
          <h3>Your Goals</h3>
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Goal'}
          </button>
        </div>

        {showForm && (
          <div className="goal-form">
            <div className="form-group">
              <label>Goal Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Become a Senior Engineer"
              />
            </div>
            <div className="form-group">
              <label>Target Date</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              />
            </div>
            <button onClick={createGoal}>Create Goal</button>
          </div>
        )}

        {isLoading ? (
          <div className="loading">Loading goals...</div>
        ) : (
          <div className="goals-list">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className={`goal-card ${selectedGoal?.id === goal.id ? 'selected' : ''}`}
                onClick={() => setSelectedGoal(selectedGoal?.id === goal.id ? null : goal)}
              >
                <div className="goal-header">
                  <h4>{goal.title}</h4>
                  <span className={`status-badge ${goal.status}`}>
                    {goal.status}
                  </span>
                </div>

                <div className="goal-meta">
                  <span>📅 Target: {formatDate(goal.targetDate)}</span>
                  <span>📊 {Math.round(goal.progress)}% complete</span>
                </div>

                <div className="goal-progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${goal.progress}%`,
                      backgroundColor: getProgressColor(goal.progress),
                    }}
                  />
                </div>

                <div className="milestones-preview">
                  <span>{goal.milestones.filter((m: Milestone) => m.completed).length} / {goal.milestones.length} milestones</span>
                </div>

                {selectedGoal?.id === goal.id && (
                  <div className="goal-details">
                    <h5>Milestones</h5>
                    {goal.milestones.map((milestone: Milestone) => (
                      <div key={milestone.id} className="milestone-item">
                        <label>
                          <input
                            type="checkbox"
                            checked={milestone.completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateMilestone(goal.id, milestone.id, e.target.checked);
                            }}
                          />
                          <span className={milestone.completed ? 'completed' : ''}>
                            {milestone.title}
                          </span>
                        </label>
                        {milestone.dueDate && (
                          <span className="milestone-due">
                            Due: {formatDate(milestone.dueDate)}
                          </span>
                        )}
                      </div>
                    ))}
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGoal(goal.id);
                      }}
                    >
                      Delete Goal
                    </button>
                  </div>
                )}
              </div>
            ))}

            {goals.length === 0 && !showForm && (
              <div className="no-goals">
                <p>No career goals yet. Create your first goal to start tracking!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalTracker;
