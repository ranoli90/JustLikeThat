'use client';

import React, { useState } from 'react';
import { JobRecommendation } from '../hooks/useMatching';

interface JobRecommendationCardProps {
  recommendation: JobRecommendation;
  onSave?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  onDismiss?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
}

export function JobRecommendationCard({
  recommendation,
  onSave,
  onApply,
  onDismiss,
  onViewDetails,
}: JobRecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(recommendation.saved);

  const { jobPosting, matchResult, whyRecommended, potentialConcerns } = recommendation;
  const score = Math.round(matchResult.overallScore * 100);
  const confidence = Math.round(matchResult.confidence * 100);

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

  const handleSave = () => {
    setSaved(!saved);
    onSave?.(jobPosting.id);
  };

  const formatSalary = (range?: { min: number; max: number }) => {
    if (!range) return 'Salary not specified';
    const min = (range.min / 1000).toFixed(0);
    const max = (range.max / 1000).toFixed(0);
    return `$${min}k - $${max}k`;
  };

  return (
    <div className={`border rounded-lg p-4 transition-shadow hover:shadow-md ${getScoreBg(score)}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{jobPosting.title}</h3>
            <span className={`px-2 py-0.5 rounded text-sm font-medium ${getScoreBg(score)} ${getScoreColor(score)}`}>
              {score}% Match
            </span>
          </div>
          <p className="text-gray-700 mt-1">{jobPosting.company}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
            <span>📍 {jobPosting.location}</span>
            <span>🏠 {jobPosting.remotePreference}</span>
            <span>💼 {jobPosting.jobType}</span>
            <span>💰 {formatSalary(jobPosting.salaryRange)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm text-gray-500">
            Confidence: {confidence}%
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className={`px-3 py-1 rounded text-sm ${
                saved
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {saved ? '★ Saved' : '☆ Save'}
            </button>
            <button
              onClick={() => onApply?.(jobPosting.id)}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {whyRecommended.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700">Why recommended:</p>
          <ul className="text-sm text-gray-600 list-disc list-inside">
            {whyRecommended.slice(0, 3).map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {potentialConcerns.length > 0 && expanded && (
        <div className="mt-3 p-2 bg-yellow-50 rounded">
          <p className="text-sm font-medium text-yellow-800">Considerations:</p>
          <ul className="text-sm text-yellow-700 list-disc list-inside">
            {potentialConcerns.map((concern, index) => (
              <li key={index}>{concern}</li>
            ))}
          </ul>
        </div>
      )}

      {expanded && matchResult.explanations.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 rounded">
          <p className="text-sm font-medium text-gray-700">Match Details:</p>
          <ul className="text-sm text-gray-600 list-disc list-inside">
            {matchResult.explanations.map((exp, index) => (
              <li key={index}>{exp}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between items-center mt-4 pt-3 border-t">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {expanded ? 'Show less' : 'Show more details'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails?.(jobPosting.id)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            View Full Details
          </button>
          <button
            onClick={() => onDismiss?.(jobPosting.id)}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

interface JobRecommendationsListProps {
  recommendations: JobRecommendation[];
  title?: string;
  onSave?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  onDismiss?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
  loading?: boolean;
}

export function JobRecommendationsList({
  recommendations,
  title = 'Recommended Jobs',
  onSave,
  onApply,
  onDismiss,
  onViewDetails,
  loading,
}: JobRecommendationsListProps) {
  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No recommendations available at this time.</p>
          <p className="text-sm mt-2">Try updating your preferences or job search criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-sm text-gray-500">{recommendations.length} jobs found</span>
      </div>
      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <JobRecommendationCard
            key={recommendation.jobPosting.id}
            recommendation={recommendation}
            onSave={onSave}
            onApply={onApply}
            onDismiss={onDismiss}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}
