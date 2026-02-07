import React, { useState, useEffect } from 'react';
import { interviewAPI } from '../services/api';

interface InterviewSession {
  id: string;
  interviewType: string;
  interviewFormat: string;
  status: string;
  scheduledAt?: string;
  questions: InterviewQuestion[];
}

interface InterviewQuestion {
  id: string;
  questionType: string;
  question: string;
  suggestedAnswer?: string;
  userAnswer?: string;
  difficulty: string;
  isAnswered: boolean;
}

interface AnswerFeedback {
  score: number;
  strengths: string[];
  improvementAreas: string[];
  suggestedImprovements: string[];
  overallAssessment: string;
}

export const InterviewPreparation: React.FC = () => {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'practice' | 'questions' | 'company' | 'negotiation' | 'followup'>('sessions');
  const [newSession, setNewSession] = useState({
    interviewType: 'BEHAVIORAL',
    interviewFormat: 'VIRTUAL',
    companyName: '',
    jobTitle: '',
  });

  // Mock user ID - in production, get from auth context
  const userId = 'demo-user';

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await interviewAPI.getUserSessions(userId);
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
    setLoading(false);
  };

  const createSession = async () => {
    setLoading(true);
    try {
      const session = await interviewAPI.createSession({
        userId,
        ...newSession,
      });
      setSessions([session, ...sessions]);
      setCurrentSession(session);
      setActiveTab('practice');
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    setLoading(false);
  };

  const startPractice = async (session: InterviewSession) => {
    setLoading(true);
    try {
      const result = await interviewAPI.startPractice(session.id, {
        questionType: session.interviewType,
        count: 5,
      });
      setCurrentSession(result.session);
      setCurrentQuestion(result.nextQuestion);
      setFeedback(null);
      setUserAnswer('');
      setActiveTab('practice');
    } catch (error) {
      console.error('Failed to start practice:', error);
    }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!currentSession || !currentQuestion) return;

    setLoading(true);
    try {
      const result = await interviewAPI.submitAnswer(
        currentSession.id,
        currentQuestion.id,
        userAnswer
      );
      setFeedback(result.feedback);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
    setLoading(false);
  };

  const nextQuestion = async () => {
    if (!currentSession) return;

    setLoading(true);
    try {
      const result = await interviewAPI.startPractice(currentSession.id, {
        questionType: currentSession.interviewType,
        count: 1,
      });
      setCurrentQuestion(result.nextQuestion);
      setFeedback(null);
      setUserAnswer('');
    } catch (error) {
      console.error('Failed to get next question:', error);
    }
    setLoading(false);
  };

  const generateThankYouNote = async (companyName: string, position: string) => {
    try {
      const note = await interviewAPI.generateThankYouNote({
        companyName,
        position,
        keyTopics: ['team culture', 'product roadmap', 'growth opportunities'],
        interviewDate: new Date().toISOString(),
      });
      return note;
    } catch (error) {
      console.error('Failed to generate thank you note:', error);
      return null;
    }
  };

  const getMarketSalary = async (position: string) => {
    try {
      const salary = await interviewAPI.getMarketSalaryRange(position);
      return salary;
    } catch (error) {
      console.error('Failed to get salary range:', error);
      return null;
    }
  };

  return (
    <div className="interview-preparation-container">
      <h1>Interview Preparation & Coaching</h1>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={activeTab === 'sessions' ? 'active' : ''}
          onClick={() => setActiveTab('sessions')}
        >
          My Sessions
        </button>
        <button 
          className={activeTab === 'practice' ? 'active' : ''}
          onClick={() => setActiveTab('practice')}
        >
          Practice Mode
        </button>
        <button 
          className={activeTab === 'questions' ? 'active' : ''}
          onClick={() => setActiveTab('questions')}
        >
          Question Bank
        </button>
        <button 
          className={activeTab === 'company' ? 'active' : ''}
          onClick={() => setActiveTab('company')}
        >
          Company Research
        </button>
        <button 
          className={activeTab === 'negotiation' ? 'active' : ''}
          onClick={() => setActiveTab('negotiation')}
        >
          Salary Negotiation
        </button>
        <button 
          className={activeTab === 'followup' ? 'active' : ''}
          onClick={() => setActiveTab('followup')}
        >
          Post-Interview
        </button>
      </div>

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="sessions-tab">
          <h2>Start New Practice Session</h2>
          <div className="new-session-form">
            <div className="form-group">
              <label>Interview Type</label>
              <select
                value={newSession.interviewType}
                onChange={(e) => setNewSession({ ...newSession, interviewType: e.target.value })}
              >
                <option value="BEHAVIORAL">Behavioral</option>
                <option value="TECHNICAL">Technical</option>
                <option value="SITUATIONAL">Situational</option>
                <option value="CASE_STUDY">Case Study</option>
                <option value="PANEL">Panel</option>
                <option value="PHONE_SCREEN">Phone Screen</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Format</label>
              <select
                value={newSession.interviewFormat}
                onChange={(e) => setNewSession({ ...newSession, interviewFormat: e.target.value })}
              >
                <option value="VIRTUAL">Virtual</option>
                <option value="ONSITE">On-site</option>
                <option value="PHONE">Phone</option>
                <option value="ASYNC_VIDEO">Async Video</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Company (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Google, Amazon"
                value={newSession.companyName}
                onChange={(e) => setNewSession({ ...newSession, companyName: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label>Job Title (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Software Engineer"
                value={newSession.jobTitle}
                onChange={(e) => setNewSession({ ...newSession, jobTitle: e.target.value })}
              />
            </div>
            
            <button onClick={createSession} disabled={loading}>
              {loading ? 'Creating...' : 'Start Session'}
            </button>
          </div>

          <h2>My Sessions</h2>
          <div className="sessions-list">
            {sessions.length === 0 ? (
              <p>No practice sessions yet. Create one above!</p>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="session-card">
                  <h3>{session.interviewType} Interview</h3>
                  <p>Format: {session.interviewFormat}</p>
                  <p>Status: {session.status}</p>
                  <p>Questions: {session.questions?.length || 0}</p>
                  <button onClick={() => startPractice(session)}>
                    Continue Practice
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Practice Mode Tab */}
      {activeTab === 'practice' && (
        <div className="practice-tab">
          {currentQuestion ? (
            <div className="practice-question">
              <div className="question-header">
                <span className="question-type">{currentQuestion.questionType}</span>
                <span className={`difficulty ${currentQuestion.difficulty.toLowerCase()}`}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              
              <h3>{currentQuestion.question}</h3>
              
              {currentQuestion.suggestedAnswer && (
                <div className="suggested-answer">
                  <h4>Sample Answer:</h4>
                  <p>{currentQuestion.suggestedAnswer}</p>
                </div>
              )}
              
              <div className="answer-input">
                <label>Your Answer:</label>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={6}
                />
              </div>
              
              <div className="practice-actions">
                <button 
                  onClick={submitAnswer} 
                  disabled={loading || !userAnswer.trim()}
                >
                  {loading ? 'Analyzing...' : 'Submit for Feedback'}
                </button>
                <button onClick={nextQuestion} disabled={loading}>
                  Skip Question
                </button>
              </div>

              {feedback && (
                <div className="feedback-section">
                  <h3>AI Feedback</h3>
                  <div className="score-display">
                    <div className="score-circle" style={{ 
                      background: `conic-gradient(#4CAF50 ${feedback.score * 3.6}deg, #e0e0e0 0deg)`
                    }}>
                      <span>{feedback.score}</span>
                    </div>
                    <p className="assessment">{feedback.overallAssessment}</p>
                  </div>
                  
                  <div className="feedback-details">
                    <div className="strengths">
                      <h4>✓ Strengths</h4>
                      <ul>
                        {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    
                    <div className="improvements">
                      <h4>△ Areas to Improve</h4>
                      <ul>
                        {feedback.improvementAreas.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                    
                    <div className="suggestions">
                      <h4>💡 Suggestions</h4>
                      <ul>
                        {feedback.suggestedImprovements.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-question">
              <p>Select a session from "My Sessions" to start practicing!</p>
            </div>
          )}
        </div>
      )}

      {/* Question Bank Tab */}
      {activeTab === 'questions' && (
        <div className="questions-tab">
          <QuestionBank />
        </div>
      )}

      {/* Company Research Tab */}
      {activeTab === 'company' && (
        <div className="company-tab">
          <CompanyResearch />
        </div>
      )}

      {/* Salary Negotiation Tab */}
      {activeTab === 'negotiation' && (
        <div className="negotiation-tab">
          <SalaryNegotiation onGetMarketSalary={getMarketSalary} />
        </div>
      )}

      {/* Post-Interview Tab */}
      {activeTab === 'followup' && (
        <div className="followup-tab">
          <PostInterview 
            onGenerateThankYou={generateThankYouNote}
            companyName={currentSession?.company?.name || newSession.companyName}
            position={newSession.jobTitle}
          />
        </div>
      )}

      <style>{`
        .interview-preparation-container {
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
        
        .sessions-tab, .practice-tab, .questions-tab, .company-tab, .negotiation-tab, .followup-tab {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .new-session-form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .form-group label {
          font-weight: bold;
          font-size: 14px;
        }
        
        .form-group input, .form-group select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        
        .sessions-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .session-card {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 10px;
        }
        
        .question-header {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .question-type {
          background: #e3f2fd;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 12px;
        }
        
        .difficulty {
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 12px;
        }
        
        .difficulty.easy { background: #e8f5e9; color: #2e7d32; }
        .difficulty.medium { background: #fff3e0; color: #ef6c00; }
        .difficulty.hard { background: #ffebee; color: #c62828; }
        
        .answer-input textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          resize: vertical;
        }
        
        .practice-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        
        .practice-actions button {
          padding: 12px 24px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          background: #4CAF50;
          color: white;
        }
        
        .practice-actions button:disabled {
          background: #ccc;
        }
        
        .feedback-section {
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
        }
        
        .score-display {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
        }
        
        .feedback-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .strengths h4 { color: #2e7d32; }
        .improvements h4 { color: #ef6c00; }
        .suggestions h4 { color: #1565c0; }
      `}</style>
    </div>
  );
};

// Question Bank Component
const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [questionType, setQuestionType] = useState('BEHAVIORAL');
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await interviewAPI.generateQuestions(questionType, undefined, 10);
      setQuestions(data);
      setSelectedQuestion(data.at(0) ?? null);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuestions();
  }, [questionType]);

  return (
    <div className="question-bank">
      <h2>Interview Question Bank</h2>
      
      <div className="filter-bar">
        <label>Question Type:</label>
        <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
          <option value="BEHAVIORAL">Behavioral</option>
          <option value="TECHNICAL">Technical</option>
          <option value="SITUATIONAL">Situational</option>
          <option value="COMPANY_CULTURE">Company Culture</option>
          <option value="ROLE_SPECIFIC">Role Specific</option>
        </select>
        <button onClick={loadQuestions} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Questions'}
        </button>
      </div>

      <div className="questions-content">
        <div className="questions-list">
          {questions.map((q, index) => (
            <div 
              key={index} 
              className={`question-item ${selectedQuestion === q ? 'selected' : ''}`}
              onClick={() => setSelectedQuestion(q)}
            >
              <span className={`difficulty-badge ${q.difficulty?.toLowerCase()}`}>
                {q.difficulty}
              </span>
              <p>{q.question.substring(0, 100)}...</p>
            </div>
          ))}
        </div>

        {selectedQuestion && (
          <div className="question-detail">
            <h3>{selectedQuestion.question}</h3>
            <span className={`difficulty-badge ${selectedQuestion.difficulty?.toLowerCase()}`}>
              {selectedQuestion.difficulty}
            </span>
            <span className="question-type-badge">{selectedQuestion.type}</span>
            
            <div className="tags">
              {selectedQuestion.tags?.map((tag: string, i: number) => (
                <span key={i} className="tag">{tag}</span>
              ))}
            </div>
            
            <div className="suggested-answer-section">
              <h4>Suggested Answer Structure:</h4>
              <p>{selectedQuestion.suggestedAnswer}</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .question-bank { padding: 10px; }
        .filter-bar { display: flex; gap: 15px; align-items: center; margin-bottom: 20px; }
        .filter-bar select { padding: 8px; }
        .filter-bar button { padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 5px; }
        
        .questions-content { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
        .questions-list { max-height: 500px; overflow-y: auto; }
        
        .question-item {
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .question-item:hover, .question-item.selected {
          border-color: #4CAF50;
          background: #f8f9fa;
        }
        
        .question-detail {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
        }
        
        .difficulty-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          margin-right: 10px;
        }
        
        .difficulty-badge.easy { background: #e8f5e9; color: #2e7d32; }
        .difficulty-badge.medium { background: #fff3e0; color: #ef6c00; }
        .difficulty-badge.hard { background: #ffebee; color: #c62828; }
        
        .question-type-badge {
          background: #e3f2fd;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
        }
        
        .tags { display: flex; gap: 8px; margin: 15px 0; flex-wrap: wrap; }
        .tag { background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        
        .suggested-answer-section {
          margin-top: 20px;
          padding: 15px;
          background: white;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

// Company Research Component
const CompanyResearch: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const researchCompany = async () => {
    if (!companyName.trim()) return;
    setLoading(true);
    try {
      // For demo, create a session first
      const session = await interviewAPI.createSession({
        userId: 'demo-user',
        interviewType: 'BEHAVIORAL',
        interviewFormat: 'VIRTUAL',
        companyName,
      });
      setSessionId(session.id);
      
      const data = await interviewAPI.researchCompany(session.id, companyName);
      setInsights(data);
    } catch (error) {
      console.error('Failed to research company:', error);
    }
    setLoading(false);
  };

  return (
    <div className="company-research">
      <h2>Company Research & Insights</h2>
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter company name (e.g., Google, Amazon)"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && researchCompany()}
        />
        <button onClick={researchCompany} disabled={loading}>
          {loading ? 'Researching...' : 'Research Company'}
        </button>
      </div>

      {insights && (
        <div className="company-insights">
          <div className="company-header">
            <h3>{insights.name}</h3>
            <div className="company-meta">
              <span>{insights.industry}</span>
              <span>{insights.size}</span>
              <span>{insights.location}</span>
            </div>
          </div>

          <div className="insights-grid">
            <div className="insight-card">
              <h4>Company Culture</h4>
              <p>{insights.culture}</p>
            </div>

            <div className="insight-card">
              <h4>Core Values</h4>
              <ul>
                {insights.values?.map((v: string, i: number) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>

            <div className="insight-card">
              <h4>Interview Process</h4>
              <p>{insights.interviewProcess}</p>
            </div>

            <div className="insight-card">
              <h4>Salary Range</h4>
              <p>{insights.salaryRange?.min.toLocaleString()} - {insights.salaryRange?.max.toLocaleString()} {insights.salaryRange?.currency}</p>
              <p className="rating">Glassdoor: ⭐ {insights.glassdoorRating}</p>
            </div>
          </div>

          <div className="tips-section">
            <h4>Interview Tips</h4>
            <div className="tips-grid">
              <div className="tip-category">
                <h5>Preparation Tips</h5>
                <ul>
                  {(insights.tips?.preparation || []).map((t: string, i: number) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="tip-category">
                <h5>Technical Tips</h5>
                <ul>
                  {(insights.tips?.technical || []).map((t: string, i: number) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="tip-category">
                <h5>Behavioral Tips</h5>
                <ul>
                  {(insights.tips?.behavioral || []).map((t: string, i: number) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .company-research { padding: 10px; }
        .search-bar { display: flex; gap: 15px; margin-bottom: 30px; }
        .search-bar input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 5px; }
        .search-bar button { padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 5px; }
        
        .company-header { margin-bottom: 20px; }
        .company-meta { display: flex; gap: 15px; color: #666; margin-top: 5px; }
        
        .insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .insight-card { background: #f8f9fa; padding: 20px; border-radius: 10px; }
        .insight-card h4 { margin-bottom: 10px; color: #333; }
        .rating { color: #f39c12; margin-top: 10px; }
        
        .tips-section { background: #e3f2fd; padding: 20px; border-radius: 10px; }
        .tips-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .tip-category h5 { margin-bottom: 10px; }
        .tip-category ul { padding-left: 20px; }
        .tip-category li { margin-bottom: 5px; }
      `}</style>
    </div>
  );
};

// Salary Negotiation Component
const SalaryNegotiation: React.FC<{ onGetMarketSalary: (position: string) => Promise<any> }> = ({ onGetMarketSalary }) => {
  const [position, setPosition] = useState('');
  const [marketSalary, setMarketSalary] = useState<any>(null);
  const [targetSalary, setTargetSalary] = useState('');
  const [negotiation, setNegotiation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getMarketData = async () => {
    if (!position.trim()) return;
    setLoading(true);
    try {
      const data = await onGetMarketSalary(position);
      setMarketSalary(data);
    } catch (error) {
      console.error('Failed to get market data:', error);
    }
    setLoading(false);
  };

  const getNegotiationTips = () => {
    return [
      { title: 'Research Market Rates', content: 'Use salary databases like Glassdoor, Levels.fyi, and LinkedIn Salary to understand the market range for your role, experience level, and location.' },
      { title: 'Never Disclose Current Salary', content: 'In many places, it\'s illegal for employers to ask about your current salary. If asked, redirect to your salary expectations.' },
      { title: 'State a Range, Not a Number', content: 'Give yourself room to negotiate by stating a range that includes your target salary. The bottom should be what you\'d comfortably accept.' },
      { title: 'Consider Total Compensation', content: 'Don\'t focus only on base salary. Consider bonuses, equity, benefits, PTO, and other perks when evaluating offers.' },
      { title: 'Get Everything in Writing', content: 'Once you agree on terms, request a written offer letter detailing all components of compensation.' },
      { title: 'Don\'t Rush the Decision', content: 'Take time to evaluate the offer. It\'s okay to ask for 24-48 hours to consider before responding.' },
    ];
  };

  return (
    <div className="salary-negotiation">
      <h2>Salary Negotiation Preparation</h2>

      <div className="market-research">
        <h3>Market Salary Research</h3>
        <div className="research-form">
          <input
            type="text"
            placeholder="Enter job title (e.g., Senior Software Engineer)"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <button onClick={getMarketData} disabled={loading}>
            {loading ? 'Researching...' : 'Get Market Data'}
          </button>
        </div>

        {marketSalary && (
          <div className="market-results">
            <div className="salary-range-display">
              <h4>Market Range for {position}</h4>
              <div className="range-values">
                <span className="min">${marketSalary.min.toLocaleString()}</span>
                <span className="separator">-</span>
                <span className="max">${marketSalary.max.toLocaleString()}</span>
              </div>
              <p className="source">Source: {marketSalary.source}</p>
            </div>

            <div className="salary-input">
              <label>Your Target Salary:</label>
              <input
                type="number"
                placeholder="Enter your target"
                value={targetSalary}
                onChange={(e) => setTargetSalary(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="negotiation-tips">
        <h3>Negotiation Best Practices</h3>
        <div className="tips-list">
          {getNegotiationTips().map((tip, i) => (
            <div key={i} className="tip-card">
              <h5>{tip.title}</h5>
              <p>{tip.content}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .salary-negotiation { padding: 10px; }
        .market-research { background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
        .research-form { display: flex; gap: 15px; margin-bottom: 20px; }
        .research-form input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 5px; }
        .research-form button { padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 5px; }
        
        .market-results { display: flex; gap: 30px; align-items: center; flex-wrap: wrap; }
        .salary-range-display h4 { margin-bottom: 10px; }
        .range-values { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: bold; }
        .range-values .min { color: #ef6c00; }
        .range-values .max { color: #2e7d32; }
        .source { font-size: 12px; color: #666; margin-top: 5px; }
        
        .negotiation-tips h3 { margin-bottom: 20px; }
        .tips-list { display: grid; gap: 15px; }
        .tip-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50; }
        .tip-card h5 { margin-bottom: 5px; }
        .tip-card p { color: #666; font-size: 14px; }
      `}</style>
    </div>
  );
};

// Post-Interview Component
const PostInterview: React.FC<{ onGenerateThankYou: (company: string, position: string) => Promise<any>; companyName: string; position: string }> = ({ onGenerateThankYou, companyName, position }) => {
  const [thankYouNote, setThankYouNote] = useState<any>(null);
  const [keyTopics, setKeyTopics] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'thankyou' | 'timeline' | 'guidance'>('thankyou');

  const generateNote = async () => {
    setLoading(true);
    try {
      const topics = keyTopics.split(',').map(t => t.trim()).filter(Boolean);
      const note = await onGenerateThankYou(companyName || 'the company', position || 'the position');
      setThankYouNote({ ...note, keyTopics: topics });
    } catch (error) {
      console.error('Failed to generate note:', error);
    }
    setLoading(false);
  };

  const guidance = {
    timeline: [
      { time: 'Same day', action: 'Send thank you email within hours of interview' },
      { time: 'Day 1-2', action: 'Send personalized thank you notes to each interviewer' },
      { time: 'Day 3-5', action: 'Send follow-up if no response (optional)' },
      { time: 'Day 7-10', action: 'Send second follow-up if still no response' },
      { time: '2 weeks', action: 'Typical decision timeline ends here' },
    ],
    signs: [
      'Interviewer mentioned specific next steps',
      'You met with multiple team members',
      'Discussion focused on your start date',
      'They asked about your availability',
      'Enthusiastic responses to your questions',
    ],
    redFlags: [
      'Vague answers about the role or team',
      'Interviewer seemed distracted or rushed',
      'No discussion of next steps',
      'Negative comments about current team members',
      'Unrealistic expectations for the role',
    ],
  };

  return (
    <div className="post-interview">
      <h2>Post-Interview Follow-Up</h2>

      <div className="section-tabs">
        <button 
          className={activeSection === 'thankyou' ? 'active' : ''}
          onClick={() => setActiveSection('thankyou')}
        >
          Thank You Notes
        </button>
        <button 
          className={activeSection === 'timeline' ? 'active' : ''}
          onClick={() => setActiveSection('timeline')}
        >
          Follow-Up Timeline
        </button>
        <button 
          className={activeSection === 'guidance' ? 'active' : ''}
          onClick={() => setActiveSection('guidance')}
        >
          Guidance
        </button>
      </div>

      {activeSection === 'thankyou' && (
        <div className="thankyou-section">
          <h3>Generate Thank You Note</h3>
          <p>Enter key topics discussed during your interview to personalize your thank you note.</p>
          
          <div className="topics-input">
            <input
              type="text"
              placeholder="Topics discussed (comma separated): e.g., product roadmap, team culture, growth opportunities"
              value={keyTopics}
              onChange={(e) => setKeyTopics(e.target.value)}
            />
            <button onClick={generateNote} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Note'}
            </button>
          </div>

          {thankYouNote && (
            <div className="generated-note">
              <div className="note-preview">
                <h4>Subject:</h4>
                <p>{thankYouNote.subject}</p>
                
                <h4>Body:</h4>
                <pre>{thankYouNote.body}</pre>
              </div>
              
              <div className="tips">
                <h4>💡 Tips for Sending:</h4>
                <ul>
                  {thankYouNote.tips.map((tip: string, i: number) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'timeline' && (
        <div className="timeline-section">
          <h3>Post-Interview Timeline</h3>
          <div className="timeline">
            {guidance.timeline.map((item, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-time">{item.time}</div>
                <div className="timeline-content">{item.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'guidance' && (
        <div className="guidance-section">
          <div className="guidance-card positive">
            <h4>✓ Positive Signs</h4>
            <ul>
              {guidance.signs.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          
          <div className="guidance-card negative">
            <h4>△ Red Flags</h4>
            <ul>
              {guidance.redFlags.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>

          <div className="guidance-card do">
            <h4>✅ What to Do</h4>
            <ul>
              <li>Reflect on the interview and note key points discussed</li>
              <li>Send personalized thank you notes within 24 hours</li>
              <li>Research the company more deeply</li>
              <li>Prepare for potential second interviews</li>
              <li>Update your application materials with new insights</li>
              <li>Connect with interviewers on LinkedIn (if appropriate)</li>
              <li>Keep applying to other opportunities</li>
            </ul>
          </div>

          <div className="guidance-card dont">
            <h4>❌ What Not to Do</h4>
            <ul>
              <li>Don't spam the recruiter with multiple follow-ups</li>
              <li>Don't badmouth competitors or other offers</li>
              <li>Don't reveal your salary expectations unnecessarily</li>
              <li>Don't panic if you don't hear back immediately</li>
              <li>Don't accept the first offer without negotiation</li>
              <li>Don't burn bridges, even if the interview went poorly</li>
            </ul>
          </div>
        </div>
      )}

      <style>{`
        .post-interview { padding: 10px; }
        .section-tabs { display: flex; gap: 10px; margin-bottom: 20px; }
        .section-tabs button { padding: 10px 20px; border: none; background: #f0f0f0; border-radius: 5px; cursor: pointer; }
        .section-tabs button.active { background: #4CAF50; color: white; }
        
        .thankyou-section { background: #f8f9fa; padding: 20px; border-radius: 10px; }
        .topics-input { display: flex; gap: 15px; margin: 20px 0; }
        .topics-input input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 5px; }
        .topics-input button { padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 5px; }
        
        .generated-note { margin-top: 20px; }
        .note-preview { background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; }
        .note-preview pre { white-space: pre-wrap; font-family: inherit; line-height: 1.6; }
        
        .tips { background: #e3f2fd; padding: 15px; border-radius: 8px; }
        .tips h4 { margin-bottom: 10px; }
        .tips ul { padding-left: 20px; }
        .tips li { margin-bottom: 5px; }
        
        .timeline { position: relative; padding-left: 30px; }
        .timeline::before { content: ''; position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: #ddd; }
        .timeline-item { position: relative; padding-bottom: 20px; }
        .timeline-item::before { content: ''; position: absolute; left: -25px; top: 5px; width: 10px; height: 10px; background: #4CAF50; border-radius: 50%; }
        .timeline-time { font-weight: bold; color: #4CAF50; }
        
        .guidance-section { display: grid; gap: 20px; }
        .guidance-card { padding: 20px; border-radius: 10px; }
        .guidance-card.positive { background: #e8f5e9; border-left: 4px solid #2e7d32; }
        .guidance-card.negative { background: #fff3e0; border-left: 4px solid #ef6c00; }
        .guidance-card.do { background: #e3f2fd; border-left: 4px solid #1565c0; }
        .guidance-card.dont { background: #ffebee; border-left: 4px solid #c62828; }
        .guidance-card h4 { margin-bottom: 10px; }
        .guidance-card ul { padding-left: 20px; }
        .guidance-card li { margin-bottom: 5px; }
      `}</style>
    </div>
  );
};

export default InterviewPreparation;
