import React, { useState, useEffect } from 'react';

interface Course {
  id: string;
  title: string;
  skills: string[];
  provider: string;
  duration: number;
  difficulty: string;
  rating: number;
  type: string;
  url: string;
  completed?: boolean;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  courses: string[];
  skills: string[];
  estimatedTime: number;
  deadline: Date;
  completed: boolean;
}

interface LearningPath {
  id: string;
  targetRole: string;
  courses: Course[];
  milestones: Milestone[];
  estimatedTime: number;
  progress: number;
  status: string;
}

export const LearningPathViewer: React.FC = () => {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    targetRole: '',
    currentSkills: '',
    preferredPace: 'moderate' as 'intensive' | 'moderate' | 'relaxed',
    dailyHoursAvailable: 2,
  });

  const generatePath = async () => {
    if (!formData.targetRole) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/v1/career-coaching/learning-path/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: formData.targetRole,
          currentSkills: formData.currentSkills.split(',').map(s => s.trim()),
          preferredPace: formData.preferredPace,
          dailyHoursAvailable: formData.dailyHoursAvailable,
          certificates: [],
        }),
      });

      const data = await response.json();
      setPath(data);
    } catch (error) {
      console.error('Error generating learning path:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateCourseProgress = async (courseId: string, completed: boolean) => {
    if (!path) return;

    try {
      const response = await fetch(`/api/v1/career-coaching/learning-path/${path.id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, completed }),
      });

      const data = await response.json();
      setPath(data);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const formatDuration = (hours: number) => {
    if (hours < 40) return `${hours}h`;
    const weeks = Math.ceil(hours / 40);
    return `${weeks} weeks`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="learning-path-viewer">
      <div className="viewer-header">
        <h2>Learning Path Generator</h2>
        <p>Get a personalized learning path to reach your career goals</p>
      </div>

      {!path ? (
        <div className="generator-form">
          <div className="form-group">
            <label>Target Role</label>
            <input
              type="text"
              value={formData.targetRole}
              onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div className="form-group">
            <label>Current Skills (comma-separated)</label>
            <input
              type="text"
              value={formData.currentSkills}
              onChange={(e) => setFormData({ ...formData, currentSkills: e.target.value })}
              placeholder="e.g., JavaScript, React, HTML"
            />
          </div>

          <div className="form-group">
            <label>Learning Pace</label>
            <select
              value={formData.preferredPace}
              onChange={(e) => setFormData({ ...formData, preferredPace: e.target.value as typeof formData.preferredPace })}
            >
              <option value="intensive">Intensive (faster)</option>
              <option value="moderate">Moderate</option>
              <option value="relaxed">Relaxed (slower)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Hours Available Per Day</label>
            <input
              type="number"
              value={formData.dailyHoursAvailable}
              onChange={(e) => setFormData({ ...formData, dailyHoursAvailable: Number(e.target.value) })}
              min="1"
              max="10"
            />
          </div>

          <button
            className="generate-button"
            onClick={generatePath}
            disabled={isGenerating || !formData.targetRole}
          >
            {isGenerating ? 'Generating...' : 'Generate Learning Path'}
          </button>
        </div>
      ) : (
        <div className="path-container">
          <div className="path-header">
            <div className="path-info">
              <h3>Path to {path.targetRole}</h3>
              <p>Estimated time: {formatDuration(path.estimatedTime)}</p>
            </div>
            <div className="progress-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" className="progress-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="progress-fill"
                  style={{
                    strokeDasharray: `${(path.progress / 100) * 283} 283`,
                  }}
                />
              </svg>
              <span className="progress-text">{Math.round(path.progress)}%</span>
            </div>
            <button onClick={() => setPath(null)} className="new-path-button">
              New Path
            </button>
          </div>

          <div className="milestones-container">
            <h3>Milestones</h3>
            <div className="milestones-timeline">
              {path.milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className={`milestone-card ${milestone.completed ? 'completed' : ''} ${
                    selectedMilestone === milestone.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedMilestone(
                    selectedMilestone === milestone.id ? null : milestone.id
                  )}
                >
                  <div className="milestone-header">
                    <span className="milestone-number">{index + 1}</span>
                    <h4>{milestone.title}</h4>
                    {milestone.completed && <span className="check-mark">✓</span>}
                  </div>
                  <p className="milestone-description">{milestone.description}</p>
                  <div className="milestone-meta">
                    <span>⏱️ {formatDuration(milestone.estimatedTime)}</span>
                    <span>📚 {milestone.courses.length} courses</span>
                  </div>

                  {selectedMilestone === milestone.id && (
                    <div className="milestone-courses">
                      <h5>Courses:</h5>
                      {path.courses
                        .filter(course => milestone.courses.includes(course.id))
                        .map(course => (
                          <div key={course.id} className="course-card">
                            <div className="course-header">
                              <h6>{course.title}</h6>
                              <span
                                className="difficulty-badge"
                                style={{ backgroundColor: getDifficultyColor(course.difficulty) }}
                              >
                                {course.difficulty}
                              </span>
                            </div>
                            <div className="course-meta">
                              <span>📖 {course.provider}</span>
                              <span>⏱️ {course.duration}h</span>
                              <span>⭐ {course.rating}</span>
                            </div>
                            <div className="course-actions">
                              <a href={course.url} target="_blank" rel="noopener noreferrer">
                                View Course
                              </a>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={course.completed || false}
                                  onChange={(e) => updateCourseProgress(course.id, e.target.checked)}
                                />
                                {course.completed ? 'Completed' : 'Mark Complete'}
                              </label>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathViewer;
