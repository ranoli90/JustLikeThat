import React, { useState, useCallback } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface OptimizationSuggestion {
  section: string;
  type: 'addition' | 'modification' | 'removal' | 'formatting';
  priority: 'high' | 'medium' | 'low';
  originalText?: string;
  suggestedText?: string;
  reason: string;
  impact: number;
}

interface KeywordAnalysis {
  foundKeywords: string[];
  missingKeywords: string[];
  keywordDensity: Record<string, number>;
  keywordSuggestions: string[];
}

interface ATSCompatibility {
  score: number;
  issues: Array<{
    type: string;
    severity: string;
    message: string;
    recommendation: string;
  }>;
  formatScore: number;
  contentScore: number;
  keywordScore: number;
}

interface OptimizationResult {
  optimizationScore: number;
  keywordScore: number;
  atsScore: number;
  suggestions: OptimizationSuggestion[];
  optimizedSections: Array<{
    section: string;
    originalContent: string;
    optimizedContent: string;
    changes: string[];
  }>;
  keywordAnalysis: KeywordAnalysis;
  atsCompatibility: ATSCompatibility;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

/**
 * ResumeOptimizer - AI-powered resume analysis and optimization
 */
export const ResumeOptimizer: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [targetJobDescription, setTargetJobDescription] = useState('');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'ats' | 'keywords'>('analysis');

  const handleAnalyze = useCallback(async () => {
    if (!resumeText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      // Simulated API call
      const response = await fetch('/api/v1/ml/resume-optimization/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, targetJobDescription }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        setResult(generateMockResult());
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setResult(generateMockResult());
    } finally {
      setIsAnalyzing(false);
    }
  }, [resumeText, targetJobDescription]);

  const radarData = result ? [
    { subject: 'Keywords', A: result.keywordScore, fullMark: 100 },
    { subject: 'ATS Score', A: result.atsScore, fullMark: 100 },
    { subject: 'Optimization', A: result.optimizationScore, fullMark: 100 },
    { subject: 'Content', A: result.atsCompatibility.contentScore, fullMark: 100 },
    { subject: 'Format', A: result.atsCompatibility.formatScore, fullMark: 100 },
  ] : [];

  return (
    <div className="resume-optimizer rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">AI Resume Optimizer</h2>
      
      {/* Input Section */}
      <div className="input-section mb-6">
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Resume Text</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here..."
            rows={10}
          />
        </div>
        
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Target Job Description (Optional)
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
            value={targetJobDescription}
            onChange={(e) => setTargetJobDescription(e.target.value)}
            placeholder="Paste the job description you're targeting..."
            rows={4}
          />
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !resumeText.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="results-section">
          {/* Overall Score */}
          <div className="overall-score mb-6 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Overall Optimization Score</h3>
                <p className="text-sm text-gray-500">AI-powered resume analysis</p>
              </div>
              <div className={`text-4xl font-bold ${
                result.optimizationScore >= 80 ? 'text-green-500' :
                result.optimizationScore >= 60 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {Math.round(result.optimizationScore)}
              </div>
            </div>
            
            {/* Score Breakdown */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-blue-500">{Math.round(result.keywordScore)}%</div>
                <div className="text-sm text-gray-500">Keyword Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-500">{Math.round(result.atsScore)}%</div>
                <div className="text-sm text-gray-500">ATS Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-purple-500">{Math.round(result.optimizationScore)}%</div>
                <div className="text-sm text-gray-500">Optimization</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs mb-4">
            <div className="flex border-b">
              {(['analysis', 'ats', 'keywords'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 font-medium capitalize ${
                    activeTab === tab
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'analysis' && (
            <div className="analysis-tab">
              {/* Radar Chart */}
              <div className="mb-6">
                <h4 className="text-md mb-2 font-semibold">Score Breakdown</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="A"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Suggestions */}
              <div className="suggestions">
                <h4 className="text-md mb-2 font-semibold">Optimization Suggestions</h4>
                {result.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`mb-2 rounded-lg border-l-4 p-3 ${
                      suggestion.priority === 'high'
                        ? 'border-red-500 bg-red-50'
                        : suggestion.priority === 'medium'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium capitalize">{suggestion.section}</span>
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        suggestion.priority === 'high'
                          ? 'bg-red-200 text-red-800'
                          : suggestion.priority === 'medium'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}>
                        {suggestion.priority} priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{suggestion.reason}</p>
                    {suggestion.impact > 0 && (
                      <p className="mt-1 text-xs text-gray-500">Impact: +{suggestion.impact}%</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ats' && (
            <div className="ats-tab">
              {/* ATS Score Pie Chart */}
              <div className="mb-6 flex justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Format', value: result.atsCompatibility.formatScore },
                        { name: 'Content', value: result.atsCompatibility.contentScore },
                        { name: 'Keyword', value: result.atsCompatibility.keywordScore },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {[0, 1, 2].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* ATS Issues */}
              <div className="issues">
                <h4 className="text-md mb-2 font-semibold">ATS Compatibility Issues</h4>
                {result.atsCompatibility.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`mb-2 rounded-lg p-3 ${
                      issue.severity === 'critical'
                        ? 'border border-red-200 bg-red-50'
                        : issue.severity === 'warning'
                        ? 'border border-yellow-200 bg-yellow-50'
                        : 'border border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium capitalize">{issue.type} Issue</span>
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        issue.severity === 'critical'
                          ? 'bg-red-200 text-red-800'
                          : issue.severity === 'warning'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{issue.message}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      <span className="font-medium">Recommendation:</span> {issue.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'keywords' && (
            <div className="keywords-tab">
              {/* Keyword Analysis */}
              <div className="mb-6">
                <h4 className="text-md mb-2 font-semibold">Keyword Analysis</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="mb-2 font-medium text-green-600">Found Keywords</h5>
                    <div className="flex flex-wrap gap-1">
                      {result.keywordAnalysis.foundKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="rounded bg-green-100 px-2 py-1 text-sm text-green-800"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="mb-2 font-medium text-red-600">Missing Keywords</h5>
                    <div className="flex flex-wrap gap-1">
                      {result.keywordAnalysis.missingKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="rounded bg-red-100 px-2 py-1 text-sm text-red-800"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Keyword Suggestions */}
              <div>
                <h4 className="text-md mb-2 font-semibold">Keyword Suggestions</h4>
                <p className="mb-2 text-sm text-gray-600">
                  Consider incorporating these terms to improve ATS matching:
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.keywordAnalysis.keywordSuggestions.map((keyword, index) => (
                    <span
                      key={index}
                      className="rounded bg-purple-100 px-2 py-1 text-sm text-purple-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Generate mock result for demonstration
 */
function generateMockResult(): OptimizationResult {
  return {
    optimizationScore: 72,
    keywordScore: 68,
    atsScore: 75,
    suggestions: [
      {
        section: 'Skills',
        type: 'addition',
        priority: 'high',
        reason: 'Add missing keywords: React, Node.js, TypeScript',
        impact: 15,
      },
      {
        section: 'Experience',
        type: 'modification',
        priority: 'medium',
        reason: 'Use more action verbs and quantify achievements',
        impact: 10,
      },
      {
        section: 'Format',
        type: 'formatting',
        priority: 'high',
        reason: 'Remove tables and graphics for ATS compatibility',
        impact: 20,
      },
      {
        section: 'Summary',
        type: 'modification',
        priority: 'low',
        reason: 'Include target job keywords in summary',
        impact: 5,
      },
    ],
    optimizedSections: [],
    keywordAnalysis: {
      foundKeywords: ['project management', 'leadership', 'communication'],
      missingKeywords: ['React', 'Node.js', 'TypeScript', 'AWS', 'Agile'],
      keywordDensity: {
        'project management': 2.5,
        'leadership': 1.8,
        'communication': 1.5,
      },
      keywordSuggestions: ['Python', 'SQL', 'Data Analysis', 'Strategic Planning'],
    },
    atsCompatibility: {
      score: 75,
      issues: [
        {
          type: 'format',
          severity: 'critical',
          message: 'Document contains tables that may not parse correctly',
          recommendation: 'Convert tables to plain text or bullet points',
        },
        {
          type: 'content',
          severity: 'warning',
          message: 'Limited use of action verbs in bullet points',
          recommendation: 'Start bullet points with strong action verbs like "achieved", "led", "developed"',
        },
        {
          type: 'keyword',
          severity: 'warning',
          message: 'Missing important keywords from job description',
          recommendation: 'Review job description and incorporate key terms naturally',
        },
      ],
      formatScore: 65,
      contentScore: 78,
      keywordScore: 68,
    },
  };
}

export default ResumeOptimizer;
