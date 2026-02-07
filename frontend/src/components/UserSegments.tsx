'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { feedbackAPI } from '../services/api';

interface UserSegments {
  powerUsers: string[];
  atRiskUsers: string[];
  newUsers: string[];
}

interface UserSegmentsDisplayProps {
  userId: string;
}

export function UserSegmentsDisplay({ userId: _userId }: UserSegmentsDisplayProps) {
  const [segments, setSegments] = useState<UserSegments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        setIsLoading(true);
        const response = await feedbackAPI.getUserSegments();
        setSegments(response.data);
      } catch (err) {
        setError('Failed to fetch user segments');
        console.error('Error fetching user segments:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSegments();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/3 rounded bg-gray-300"></div>
          <div className="space-y-2">
            <div className="h-4 rounded bg-gray-300"></div>
            <div className="h-4 w-2/3 rounded bg-gray-300"></div>
            <div className="h-4 w-1/2 rounded bg-gray-300"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  if (!segments) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
            <span className="text-xl text-green-600">⭐</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Power Users</h3>
            <p className="text-sm text-gray-600">
              {segments.powerUsers.length} users with high engagement
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {segments.powerUsers.slice(0, 10).map((userId, index) => (
            <span
              key={userId}
              className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700"
            >
              User {index + 1}
            </span>
          ))}
          {segments.powerUsers.length > 10 && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              +{segments.powerUsers.length - 10} more
            </span>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
            <span className="text-xl text-red-600">⚠️</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">At-Risk Users</h3>
            <p className="text-sm text-gray-600">
              {segments.atRiskUsers.length} users showing disengagement
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {segments.atRiskUsers.slice(0, 10).map((userId, index) => (
            <span
              key={userId}
              className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-700"
            >
              User {index + 1}
            </span>
          ))}
          {segments.atRiskUsers.length > 10 && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              +{segments.atRiskUsers.length - 10} more
            </span>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
            <span className="text-xl text-blue-600">🆕</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">New Users</h3>
            <p className="text-sm text-gray-600">
              {segments.newUsers.length} users in onboarding
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {segments.newUsers.slice(0, 10).map((userId, index) => (
            <span
              key={userId}
              className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
            >
              User {index + 1}
            </span>
          ))}
          {segments.newUsers.length > 10 && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              +{segments.newUsers.length - 10} more
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
