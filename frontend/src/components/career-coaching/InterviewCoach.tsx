import React, { useState } from 'react';

interface Question {
  id: string;
  question: string;
  category: string;
  type: 'behavioral' | 'technical';
  difficulty: string;
  order: number;
}

interface Answer {
  questionId: string;
  answer: string;
  evaluation?: {
    overallScore: number;
    criteria: { name: string; score: number; feedback: string }[];
    strengths: string[];
    improvements: string[];
    tips: string[];
  };
  submittedAt?: string;
}

interface PracticeSession {
  id: string;
  jobType: string;
  questions: Question[];
  answers: Record<string, Answer>;
  overallScore: number;
}

export const InterviewCoach: React.FC = () => {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [jobType, setJobType] = useState('');

  const startSession = async () => {
    if (!jobType) return;

    try {
      const response = await fetch('/api/v1/career-coaching/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobType,
          questionCount: 5,
        }),
      });

      const data = await response.json();
      setSession(data);
      setCurrentQuestionIndex(0);
      setAnswer('');
      setShowFeedback(false);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const submitAnswer = async () => {
    if (!session || !answer.trim()) return;

    const currentQuestion = session.questions[currentQuestionIndex];
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/v1/career-coaching/interview/${session.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer,
        }),
      });

      const evaluation = await response.json();

      const updatedSession = {
        ...session,
        answers: {
          ...session.answers,
          [currentQuestion.id]: {
            questionId: currentQuestion.id,
            answer,
            evaluation,
            submittedAt: new Date().toISOString(),
          },
        },
      };

      setSession(updatedSession);
      setShowFeedback(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (!session) return;
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      const nextQ = session.questions[currentQuestionIndex + 1];
      setAnswer(session.answers[nextQ.id]?.answer || '');
      setShowFeedback(false);
    }
  };

  const prevQuestion = () => {
    if (!session) return;
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevQ = session.questions[currentQuestionIndex - 1];
      setAnswer(session.answers[prevQ.id]?.answer || '');
      setShowFeedback(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const currentQuestion = session?.questions[currentQuestionIndex];
  const currentAnswer = session?.answers[currentQuestion?.id || ''];

  return (
    <div className="interview-coach">
      <div className="coach-header">
        <h2>Interview Coach</h2>
        <p>Practice your interview skills with AI-powered feedback</p>
      </div>

      {!session ? (
        <div className="start-form">
          <div className="form-group">
            <label>Job Type / Role</label>
            <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
              <option value="">Select a role...</option>
              <option value="software-engineer">Software Engineer</option>
              <option value="product-manager">Product Manager</option>
              <option value="data-scientist">Data Scientist</option>
              <option value="devops-engineer">DevOps Engineer</option>
              <option value="designer">Designer</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>
          <button onClick={startSession} disabled={!jobType}>
            Start Practice Session
          </button>
        </div>
      ) : (
        <div className="session-container">
          <div className="session-progress">
            <span>Question {currentQuestionIndex + 1} of {session.questions.length}</span>
            <div className="progress-bar">
              {session.questions.map((q, i) => (
                <div
                  key={q.id}
                  className={`progress-dot ${session.answers[q.id]?.evaluation ? 'completed' : ''} ${
                    i === currentQuestionIndex ? 'current' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="question-container">
            <div className="question-header">
              <span className={`type-badge ${currentQuestion?.type}`}>
                {currentQuestion?.type}
              </span>
              <span className="category">{currentQuestion?.category}</span>
              <span className="difficulty">{currentQuestion?.difficulty}</span>
            </div>
            <h3>{currentQuestion?.question}</h3>
          </div>

          <div className="answer-section">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here... Use the STAR method (Situation, Task, Action, Result)"
              rows={6}
            />
            <div className="answer-actions">
              <button onClick={prevQuestion} disabled={currentQuestionIndex === 0}>
                ← Previous
              </button>
              <button onClick={submitAnswer} disabled={isSubmitting || !answer.trim()}>
                {isSubmitting ? 'Evaluating...' : 'Submit Answer'}
              </button>
              <button onClick={nextQuestion} disabled={currentQuestionIndex === session.questions.length - 1}>
                Next →
              </button>
            </div>
          </div>

          {showFeedback && currentAnswer?.evaluation && (
            <div className="feedback-container">
              <div className="score-overview">
                <div
                  className="score-circle"
                  style={{ borderColor: getScoreColor(currentAnswer.evaluation.overallScore) }}
                >
                  <span>{Math.round(currentAnswer.evaluation.overallScore)}</span>
                </div>
                <p>Overall Score</p>
              </div>

              <div className="criteria-breakdown">
                <h4>Evaluation Criteria</h4>
                {currentAnswer.evaluation.criteria.map((criterion, i) => (
                  <div key={i} className="criterion">
                    <span>{criterion.name}</span>
                    <div className="criterion-bar">
                      <div
                        className="criterion-fill"
                        style={{
                          width: `${criterion.score * 25}%`,
                          backgroundColor: getScoreColor(criterion.score * 25),
                        }}
                      />
                    </div>
                    <span>{criterion.score}/4</span>
                  </div>
                ))}
              </div>

              <div className="feedback-details">
                <div className="strengths">
                  <h4>✅ Strengths</h4>
                  <ul>
                    {currentAnswer.evaluation.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="improvements">
                  <h4>📈 Areas to Improve</h4>
                  <ul>
                    {currentAnswer.evaluation.improvements.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="tips">
                <h4>💡 Tips</h4>
                <ul>
                  {currentAnswer.evaluation.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="session-summary">
            <button onClick={() => setSession(null)} className="end-session">
              End Session
            </button>
            <div className="session-score">
              Session Score: {Math.round(session.overallScore || 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewCoach;
