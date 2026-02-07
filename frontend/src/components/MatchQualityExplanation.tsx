'use client';

import React, { useState } from 'react';
import { MatchQualityExplanation } from '../hooks/useMatching';

interface MatchQualityExplanationProps {
  explanation: MatchQualityExplanation;
  onClose?: () => void;
}

export function MatchQualityExplanationCard({ explanation, onClose }: MatchQualityExplanationProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'experience' | 'culture' | 'career'>('overview');

  const score = Math.round(explanation.overallScore * 100);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'skills', label: 'Skills' },
    { id: 'experience', label: 'Experience' },
    { id: 'culture', label: 'Culture' },
    { id: 'career', label: 'Career' },
  ];

  return (
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-white shadow-lg">
      <div className={`p-4 ${getScoreBg(score)}`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">Job Match Analysis</h2>
            <p className="mt-1 text-sm text-gray-700">{explanation.summary}</p>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}%</div>
            <div className="text-sm capitalize text-gray-600">{explanation.scoreBand}</div>
          </div>
        </div>
      </div>

      <div className="border-b">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {explanation.strengths.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-green-700">✓ Strengths</h3>
                <ul className="space-y-2">
                  {explanation.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-green-600">•</span>
                      <div>
                        <span className="font-medium">{strength.category}:</span> {strength.description}
                        <span className="ml-2 text-xs text-gray-500">({strength.evidence})</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {explanation.weaknesses.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-orange-700">⚠ Considerations</h3>
                <ul className="space-y-2">
                  {explanation.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-orange-600">•</span>
                      <div>
                        <span className="font-medium">{weakness.category}:</span> {weakness.description}
                        {weakness.mitigation && (
                          <p className="ml-4 mt-1 text-gray-600">💡 {weakness.mitigation}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {explanation.greenFlags.length > 0 && (
              <div className="rounded bg-green-50 p-3">
                <h3 className="mb-1 font-semibold text-green-700">✓ Green Flags</h3>
                <ul className="text-sm text-green-700">
                  {explanation.greenFlags.map((flag, index) => (
                    <li key={index}>• {flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {explanation.redFlags.length > 0 && (
              <div className="rounded bg-red-50 p-3">
                <h3 className="mb-1 font-semibold text-red-700">⚠ Red Flags</h3>
                <ul className="text-sm text-red-700">
                  {explanation.redFlags.map((flag, index) => (
                    <li key={index}>• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Skills Match Score</h3>
              <span className={`text-lg font-bold ${getScoreColor(explanation.skillAnalysis.skillMatchScore * 100)}`}>
                {Math.round(explanation.skillAnalysis.skillMatchScore * 100)}%
              </span>
            </div>

            {explanation.skillAnalysis.matchedSkills.length > 0 && (
              <div>
                <h4 className="mb-1 font-medium text-green-700">✓ Matched Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {explanation.skillAnalysis.matchedSkills.map((skill, index) => (
                    <span key={index} className="rounded bg-green-100 px-2 py-1 text-sm text-green-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {explanation.skillAnalysis.missingSkills.length > 0 && (
              <div>
                <h4 className="mb-1 font-medium text-orange-700">⚠ Missing Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {explanation.skillAnalysis.missingSkills.map((skill, index) => (
                    <span key={index} className="rounded bg-orange-100 px-2 py-1 text-sm text-orange-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {explanation.skillAnalysis.bonusSkills.length > 0 && (
              <div>
                <h4 className="mb-1 font-medium text-blue-700">⭐ Bonus Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {explanation.skillAnalysis.bonusSkills.map((skill, index) => (
                    <span key={index} className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {explanation.skillAnalysis.recommendations.length > 0 && (
              <div className="rounded bg-blue-50 p-3">
                <h4 className="mb-1 font-medium text-blue-700">Recommendations</h4>
                <ul className="text-sm text-blue-700">
                  {explanation.skillAnalysis.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Experience Match</h3>
              <span className={`rounded px-2 py-1 font-medium ${
                explanation.experienceAnalysis.levelMatch === 'perfect' ? 'bg-green-100 text-green-700' :
                explanation.experienceAnalysis.levelMatch === 'good' ? 'bg-green-50 text-green-600' :
                explanation.experienceAnalysis.levelMatch === 'acceptable' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {explanation.experienceAnalysis.levelMatch}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded bg-gray-50 p-3">
                <div className="text-sm text-gray-600">Required Experience</div>
                <div className="font-semibold">{explanation.experienceAnalysis.yearsExperience.required} years</div>
              </div>
              <div className="rounded bg-gray-50 p-3">
                <div className="text-sm text-gray-600">Your Experience</div>
                <div className="font-semibold">{explanation.experienceAnalysis.yearsExperience.actual} years</div>
              </div>
            </div>

            <div>
              <h4 className="mb-1 font-medium">Domain Expertise</h4>
              <p className="text-sm text-gray-700">{explanation.experienceAnalysis.domainExpertise}</p>
            </div>

            <div className="rounded bg-blue-50 p-3">
              <h4 className="mb-1 font-medium text-blue-700">Gap Analysis</h4>
              <p className="text-sm text-blue-700">{explanation.experienceAnalysis.gapAnalysis}</p>
            </div>
          </div>
        )}

        {activeTab === 'culture' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Culture Fit Score</h3>
              <span className={`text-lg font-bold ${getScoreColor(explanation.cultureAnalysis.score * 100)}`}>
                {Math.round(explanation.cultureAnalysis.score * 100)}%
              </span>
            </div>

            {explanation.cultureAnalysis.matchedValues.length > 0 && (
              <div>
                <h4 className="mb-1 font-medium text-green-700">✓ Aligned Values</h4>
                <div className="flex flex-wrap gap-2">
                  {explanation.cultureAnalysis.matchedValues.map((value, index) => (
                    <span key={index} className="rounded bg-green-100 px-2 py-1 text-sm text-green-700">
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded bg-gray-50 p-3">
              <h4 className="mb-1 font-medium">Work Style Fit</h4>
              <p className="text-sm text-gray-700">{explanation.cultureAnalysis.workStyleFit}</p>
            </div>

            {explanation.cultureAnalysis.recommendations.length > 0 && (
              <div className="rounded bg-blue-50 p-3">
                <h4 className="mb-1 font-medium text-blue-700">Tips</h4>
                <ul className="text-sm text-blue-700">
                  {explanation.cultureAnalysis.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'career' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Career Trajectory Score</h3>
              <span className={`text-lg font-bold ${getScoreColor(explanation.careerAnalysis.trajectoryScore * 100)}`}>
                {Math.round(explanation.careerAnalysis.trajectoryScore * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded bg-gray-50 p-3">
                <div className="text-sm text-gray-600">Next Role</div>
                <div className="font-semibold">{explanation.careerAnalysis.nextRole}</div>
              </div>
              <div className="rounded bg-gray-50 p-3">
                <div className="text-sm text-gray-600">Salary Growth</div>
                <div className="font-semibold text-green-600">
                  +{Math.round(explanation.careerAnalysis.salaryGrowth * 100)}%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Growth Potential:</span>
              <span className={`rounded px-2 py-1 text-sm font-medium ${
                explanation.careerAnalysis.growthPotential === 'high' ? 'bg-green-100 text-green-700' :
                explanation.careerAnalysis.growthPotential === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {explanation.careerAnalysis.growthPotential}
              </span>
            </div>

            {explanation.careerAnalysis.recommendations.length > 0 && (
              <div className="rounded bg-blue-50 p-3">
                <h4 className="mb-1 font-medium text-blue-700">Career Tips</h4>
                <ul className="text-sm text-blue-700">
                  {explanation.careerAnalysis.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {explanation.questionsToAsk.length > 0 && (
        <div className="border-t bg-gray-50 p-4">
          <h3 className="mb-2 font-semibold">Questions to Ask in Interview</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            {explanation.questionsToAsk.map((question, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600">?</span>
                {question}
              </li>
            ))}
          </ul>
        </div>
      )}

      {explanation.recommendations.length > 0 && (
        <div className="border-t p-4">
          <h3 className="mb-2 font-semibold">Final Recommendations</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            {explanation.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {onClose && (
        <div className="flex justify-end border-t p-4">
          <button
            onClick={onClose}
            className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
