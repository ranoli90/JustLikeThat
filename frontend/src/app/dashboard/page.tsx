'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobMatches, setJobMatches] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalMatches: 0,
    activeApplications: 0,
    interviews: 0,
    offers: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        setJobMatches([
          {
            id: 1,
            title: 'Senior Software Engineer',
            company: 'Tech Corp',
            location: 'Remote',
            matchScore: 0.95,
            reasons: ['Strong technical skills', 'Relevant experience', 'Remote work preference'],
            applyUrl: '#',
          },
          {
            id: 2,
            title: 'Full Stack Developer',
            company: 'Startup Inc',
            location: 'San Francisco, CA',
            matchScore: 0.88,
            reasons: ['Matching skill set', 'Desired industry', 'Salary range'],
            applyUrl: '#',
          },
          {
            id: 3,
            title: 'DevOps Engineer',
            company: 'Cloud Solutions',
            location: 'Austin, TX',
            matchScore: 0.82,
            reasons: ['DevOps experience', 'Cloud expertise', 'Location preference'],
            applyUrl: '#',
          },
        ]);

        setApplications([
          {
            id: 1,
            jobTitle: 'Senior Software Engineer',
            company: 'Tech Corp',
            status: 'Application Submitted',
            date: '2024-01-15',
          },
          {
            id: 2,
            jobTitle: 'Full Stack Developer',
            company: 'Startup Inc',
            status: 'Interview Scheduled',
            date: '2024-01-18',
          },
          {
            id: 3,
            jobTitle: 'DevOps Engineer',
            company: 'Cloud Solutions',
            status: 'Offer Received',
            date: '2024-01-20',
          },
        ]);

        setMetrics({
          totalMatches: 15,
          activeApplications: 3,
          interviews: 2,
          offers: 1,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-300 rounded"></div>
              <div className="h-96 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Track your job matches and application progress
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Matches</dt>
                    <dd className="text-lg font-medium text-gray-900">{metrics.totalMatches}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Applications</dt>
                    <dd className="text-lg font-medium text-gray-900">{metrics.activeApplications}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-lg">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Interviews</dt>
                    <dd className="text-lg font-medium text-gray-900">{metrics.interviews}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 p-3 rounded-lg">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Offers</dt>
                    <dd className="text-lg font-medium text-gray-900">{metrics.offers}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Matches */}
          <Card>
            <CardHeader>
              <CardTitle>Job Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobMatches.map((match) => (
                  <div key={match.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{match.title}</h3>
                        <p className="text-sm text-gray-600">{match.company} • {match.location}</p>
                      </div>
                      <div className="bg-green-100 px-3 py-1 rounded-full text-sm font-medium text-green-800">
                        {Math.round(match.matchScore * 100)}% Match
                      </div>
                    </div>
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Matching Reasons:</h4>
                      <div className="flex flex-wrap gap-1">
                        {match.reasons.map((reason: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button variant="primary" size="sm" className="w-full">
                      Apply Now
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  View All Matches
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{application.jobTitle}</h3>
                        <p className="text-sm text-gray-600">{application.company}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        application.status === 'Offer Received' ? 'bg-green-100 text-green-800' :
                        application.status === 'Interview Scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {application.status}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Applied on {application.date}</p>
                    <div className="mt-3 flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Update Status
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  View All Applications
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
