import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

/**
 * Job Match Result interface
 */
interface JobMatchResult {
  jobId: string;
  matchScore: number;
  successProbability: number;
  factors: MatchFactor[];
  explanation: MatchExplanation;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

interface MatchFactor {
  factor: string;
  weight: number;
  score: number;
  contribution: number;
}

interface MatchExplanation {
  summary: string;
  strengths: string[];
  concerns: string[];
  tips: string[];
}

/**
 * Colors for charts
 */
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

/**
 * MatchingDashboard - Main dashboard for ML-powered job matching
 */
export const MatchingDashboard: React.FC = () => {
  const [matchResults, setMatchResults] = useState<JobMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [candidateProfile, setCandidateProfile] = useState({
    skills: [] as string[],
    experience: [] as { title: string; duration: number; description: string }[],
    education: [] as { degree: string; field: string }[],
    summary: '',
  });
  const [preferences, setPreferences] = useState({
    location: '',
    remotePreference: '',
    salaryExpectation: 0,
  });

  const handleMatch = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulated API call - replace with actual API
      const response = await fetch('/api/v1/ml/job-matching/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: 'current-user',
          candidateProfile,
          preferences,
          jobIds: ['job-1', 'job-2', 'job-3'], // Replace with actual job IDs
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setMatchResults(data);
      } else {
        // Mock data for demonstration
        setMatchResults(generateMockResults());
      }
    } catch (error) {
      console.error('Matching failed:', error);
      setMatchResults(generateMockResults());
    } finally {
      setIsLoading(false);
    }
  }, [candidateProfile, preferences]);

  const selectedMatch = matchResults.find(m => m.jobId === selectedJob);

  return (
    <div className="matching-dashboard rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">AI-Powered Job Matching</h2>
      
      {/* Profile Input Section */}
      <div className="profile-section mb-6 rounded-lg bg-gray-50 p-4">
        <h3 className="mb-3 text-lg font-semibold">Your Profile</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Skills (comma-separated)</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={candidateProfile.skills.join(', ')}
              onChange={(e) => setCandidateProfile({
                ...candidateProfile,
                skills: e.target.value.split(',').map(s => s.trim()),
              })}
              placeholder="React, Node.js, Python..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location Preference</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={preferences.location}
              onChange={(e) => setPreferences({ ...preferences, location: e.target.value })}
              placeholder="San Francisco, CA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Remote Preference</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={preferences.remotePreference}
              onChange={(e) => setPreferences({ ...preferences, remotePreference: e.target.value })}
            >
              <option value="">No preference</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Summary</label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={candidateProfile.summary}
              onChange={(e) => setCandidateProfile({ ...candidateProfile, summary: e.target.value })}
              placeholder="Brief professional summary..."
              rows={2}
            />
          </div>
        </div>
        <button
          onClick={handleMatch}
          disabled={isLoading}
          className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : 'Find Matching Jobs'}
        </button>
      </div>

      {/* Results Section */}
      {matchResults.length > 0 && (
        <div className="results-section">
          <h3 className="mb-3 text-lg font-semibold">Matching Jobs</h3>
          
          {/* Match Score Distribution Chart */}
          <div className="mb-6">
            <h4 className="text-md mb-2 font-medium">Match Score Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={matchResults.map(r => ({
                name: `Job ${r.jobId.slice(-4)}`,
                score: Math.round(r.matchScore * 100),
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="score" fill="#8884d8">
                  {matchResults.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Job Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matchResults.map((result) => (
              <div
                key={result.jobId}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                  selectedJob === result.jobId
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedJob(result.jobId)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">Job {result.jobId.slice(-4)}</span>
                  <span className={`rounded-full px-2 py-1 text-sm ${
                    result.matchScore >= 0.8 ? 'bg-green-100 text-green-800' :
                    result.matchScore >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {Math.round(result.matchScore * 100)}% Match
                  </span>
                </div>
                <p className="mb-2 text-sm text-gray-600">
                  Success Probability: {Math.round(result.successProbability * 100)}%
                </p>
                <div className="text-xs text-gray-500">
                  {result.matchedSkills.length} matched skills
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Analysis */}
          {selectedMatch && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <h4 className="mb-3 text-lg font-semibold">Detailed Analysis: Job {selectedJob?.slice(-4)}</h4>
              
              {/* Match Factors Chart */}
              <div className="mb-4">
                <h5 className="text-md mb-2 font-medium">Match Factor Breakdown</h5>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={selectedMatch.factors.map(f => ({
                      name: f.factor.replace(/_/g, ' '),
                      contribution: Math.round(f.contribution * 100),
                      score: Math.round(f.score * 100),
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="score" name="Score" fill="#0088FE" />
                    <Bar dataKey="contribution" name="Contribution" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Explanation */}
              <div className="mb-4">
                <h5 className="text-md mb-2 font-medium">AI Analysis</h5>
                <p className="mb-2 text-gray-700">{selectedMatch.explanation.summary}</p>
                
                {selectedMatch.explanation.strengths.length > 0 && (
                  <div className="mb-2">
                    <span className="font-medium text-green-700">✓ Strengths:</span>
                    <ul className="list-inside list-disc text-sm text-gray-600">
                      {selectedMatch.explanation.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedMatch.explanation.concerns.length > 0 && (
                  <div className="mb-2">
                    <span className="font-medium text-yellow-700">⚠ Concerns:</span>
                    <ul className="list-inside list-disc text-sm text-gray-600">
                      {selectedMatch.explanation.concerns.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Skills Comparison */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-green-700">Matched Skills</h5>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedMatch.matchedSkills.map((skill, i) => (
                      <span key={i} className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-red-700">Missing Skills</h5>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedMatch.missingSkills.map((skill, i) => (
                      <span key={i} className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h5 className="mb-2 font-medium">Recommendations</h5>
                <ul className="list-inside list-disc text-sm text-gray-600">
                  {selectedMatch.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Generate mock results for demonstration
 */
function generateMockResults(): JobMatchResult[] {
  return [
    {
      jobId: 'job-001-abc123',
      matchScore: 0.85,
      successProbability: 0.78,
      factors: [
        { factor: 'semantic_similarity', weight: 0.2, score: 0.88, contribution: 0.176 },
        { factor: 'skill_match', weight: 0.35, score: 0.82, contribution: 0.287 },
        { factor: 'experience_match', weight: 0.25, score: 0.9, contribution: 0.225 },
        { factor: 'education_match', weight: 0.15, score: 0.75, contribution: 0.112 },
        { factor: 'cultural_fit', weight: 0.15, score: 0.8, contribution: 0.12 },
        { factor: 'location_match', weight: 0.1, score: 0.95, contribution: 0.095 },
      ],
      explanation: {
        summary: 'Excellent match - highly recommended',
        strengths: [
          'Strong skill alignment with job requirements',
          'Experience level exceeds requirements',
          'Location preferences are well-aligned',
        ],
        concerns: [],
        tips: ['Highlight your cloud experience in the application'],
      },
      matchedSkills: ['React', 'Node.js', 'TypeScript', 'AWS', 'GraphQL'],
      missingSkills: ['Kubernetes', 'Docker'],
      recommendations: [
        'Consider upskilling in: Kubernetes, Docker',
        'Highlight your leadership experience',
        'Research the company culture and values',
      ],
    },
    {
      jobId: 'job-002-def456',
      matchScore: 0.72,
      successProbability: 0.65,
      factors: [
        { factor: 'semantic_similarity', weight: 0.2, score: 0.75, contribution: 0.15 },
        { factor: 'skill_match', weight: 0.35, score: 0.68, contribution: 0.238 },
        { factor: 'experience_match', weight: 0.25, score: 0.8, contribution: 0.2 },
        { factor: 'education_match', weight: 0.15, score: 0.7, contribution: 0.105 },
        { factor: 'cultural_fit', weight: 0.15, score: 0.65, contribution: 0.097 },
        { factor: 'location_match', weight: 0.1, score: 0.6, contribution: 0.06 },
      ],
      explanation: {
        summary: 'Moderate match - some preparation needed',
        strengths: [
          'Experience level matches requirements',
          'Education background aligns well',
        ],
        concerns: [
          'Limited overlap between candidate skills and job requirements',
        ],
        tips: ['Consider opportunities with flexible work arrangements'],
      },
      matchedSkills: ['Python', 'Machine Learning', 'SQL'],
      missingSkills: ['TensorFlow', 'PyTorch', 'Cloud Computing'],
      recommendations: [
        'Consider upskilling in: TensorFlow, PyTorch',
        'Tailor your summary to emphasize alignment with this specific role',
      ],
    },
    {
      jobId: 'job-003-ghi789',
      matchScore: 0.58,
      successProbability: 0.45,
      factors: [
        { factor: 'semantic_similarity', weight: 0.2, score: 0.55, contribution: 0.11 },
        { factor: 'skill_match', weight: 0.35, score: 0.5, contribution: 0.175 },
        { factor: 'experience_match', weight: 0.25, score: 0.7, contribution: 0.175 },
        { factor: 'education_match', weight: 0.15, score: 0.6, contribution: 0.09 },
        { factor: 'cultural_fit', weight: 0.15, score: 0.55, contribution: 0.082 },
        { factor: 'location_match', weight: 0.1, score: 0.45, contribution: 0.045 },
      ],
      explanation: {
        summary: 'Limited match - may require significant adaptation',
        strengths: ['Experience level exceeds requirements'],
        concerns: [
          'Limited overlap between candidate skills and job requirements',
          'Cultural fit assessment is unclear',
        ],
        tips: ['Consider other opportunities with better skill alignment'],
      },
      matchedSkills: ['Project Management'],
      missingSkills: ['Data Science', 'Big Data', 'Spark', 'Hadoop'],
      recommendations: [
        'This role may be a significant stretch',
        'Consider similar roles with better skill match',
      ],
    },
  ];
}

export default MatchingDashboard;
