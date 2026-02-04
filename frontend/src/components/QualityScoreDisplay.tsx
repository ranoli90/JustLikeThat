'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface QualityScoreDisplayProps {
  scores: ComponentScore[];
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface ComponentScore {
  component: string;
  score: number;
  maxScore: number;
  weight: number;
  feedback: string[];
}

const gradeColors = {
  A: 'text-green-600 bg-green-100',
  B: 'text-blue-600 bg-blue-100',
  C: 'text-yellow-600 bg-yellow-100',
  D: 'text-orange-600 bg-orange-100',
  F: 'text-red-600 bg-red-100',
};

const scoreColors = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

export default function QualityScoreDisplay({
  scores,
  overallScore,
  grade,
  strengths,
  weaknesses,
  recommendations,
}: QualityScoreDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Overall Quality Score</p>
              <p className="text-5xl font-bold text-gray-900">{overallScore}%</p>
            </div>
            <div className={`px-6 py-3 rounded-lg ${gradeColors[grade]}`}>
              <p className="text-3xl font-bold">{grade}</p>
            </div>
          </div>
          
          {/* Score Progress Bar */}
          <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${scoreColors(overallScore)}`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Component Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Component Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scores.map((score, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{score.component}</span>
                  <span className="text-sm text-gray-500">
                    {score.score}/{score.maxScore} ({Math.round((score.score / score.maxScore) * 100)}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${scoreColors(score.score)}`}
                    style={{ width: `${(score.score / score.maxScore) * 100}%` }}
                  />
                </div>
                {score.feedback.length > 0 && (
                  <p className="text-xs text-gray-500">{score.feedback[0]}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {weaknesses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Areas for Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
