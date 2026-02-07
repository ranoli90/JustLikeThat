'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/Card';

interface FeedbackAnalyticsData {
  npsScore: number;
  csatScore: number;
  totalResponses: number;
  responseByType: {
    NPS: number;
    CSAT: number;
    OPEN_ENDED: number;
  };
  responseByTrigger: Record<string, number>;
}

interface FeedbackAnalyticsProps {
  data: FeedbackAnalyticsData;
}

export function FeedbackAnalytics({ data }: FeedbackAnalyticsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-100">
              <span className="text-xl text-blue-600">📊</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">NPS Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {data.npsScore}
                <span className="ml-1 text-sm text-gray-500">/100</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-xl text-green-600">😊</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">CSAT Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {data.csatScore}
                <span className="ml-1 text-sm text-gray-500">/100</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-purple-100">
              <span className="text-xl text-purple-600">📝</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Responses</p>
              <p className="text-3xl font-bold text-gray-900">
                {data.totalResponses}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Responses by Type</h3>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">NPS</span>
                <span className="font-medium">{data.responseByType.NPS}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{
                    width: `${(data.responseByType.NPS / data.totalResponses) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">CSAT</span>
                <span className="font-medium">{data.responseByType.CSAT}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-600"
                  style={{
                    width: `${(data.responseByType.CSAT / data.totalResponses) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">Open Ended</span>
                <span className="font-medium">{data.responseByType.OPEN_ENDED}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-purple-600"
                  style={{
                    width: `${(data.responseByType.OPEN_ENDED / data.totalResponses) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Responses by Trigger</h3>
          <div className="space-y-3">
            {Object.entries(data.responseByTrigger).map(([trigger, count]) => (
              <div key={trigger}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600">{trigger.replace('_', ' ')}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-orange-600"
                    style={{
                      width: `${(count / data.totalResponses) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Performance Summary</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-3 font-medium text-gray-900">NPS Performance</h4>
            <div className="text-center">
              <div
                className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${
                  data.npsScore >= 50 ? 'bg-green-100 text-green-800' :
                  data.npsScore >= 0 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}
              >
                {data.npsScore >= 50 ? 'Excellent' : data.npsScore >= 0 ? 'Good' : 'Need improvement'}
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-medium text-gray-900">CSAT Performance</h4>
            <div className="text-center">
              <div
                className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${
                  data.csatScore >= 80 ? 'bg-green-100 text-green-800' :
                  data.csatScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}
              >
                {data.csatScore >= 80 ? 'Excellent' : data.csatScore >= 60 ? 'Good' : 'Need improvement'}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
