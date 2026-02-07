'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { Alert } from '../../../components/ui/Alert';
import api from '../../../services/api';

interface Application {
  id: string;
  jobPosting: {
    id: string;
    title: string;
    companyName: string;
    location: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  resumeId?: string;
  notes?: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  UNDER_REVIEW: 'yellow',
  INTERVIEW_SCHEDULED: 'purple',
  INTERVIEW_COMPLETED: 'indigo',
  OFFER_RECEIVED: 'green',
  OFFER_ACCEPTED: 'green',
  REJECTED: 'red',
  WITHDRAWN: 'gray',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INTERVIEW_COMPLETED: 'Interview Completed',
  OFFER_RECEIVED: 'Offer Received',
  OFFER_ACCEPTED: 'Offer Accepted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const router = useRouter();

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { page: 1, limit: 50 };
      if (statusFilter) {
        params.state = statusFilter;
      }

      const response = await api.getApplications(params);
      setApplications(response.applications || response || []);
    } catch (err: any) {
      console.error('Failed to fetch applications:', err);
      setError(err.message || 'Failed to fetch applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationClick = (applicationId: string) => {
    router.push(`/applications/${applicationId}`);
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    try {
      await api.withdrawApplication(applicationId);
      // Refresh the applications list
      fetchApplications();
    } catch (err: any) {
      console.error('Failed to withdraw application:', err);
      setError(err.message || 'Failed to withdraw application');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading applications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">My Applications</h1>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="status-filter" className="font-medium">
                  Filter by Status:
                </label>
                <Select
                  id="status-filter"
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <option value="">All Applications</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                  <option value="INTERVIEW_COMPLETED">Interview Completed</option>
                  <option value="OFFER_RECEIVED">Offer Received</option>
                  <option value="OFFER_ACCEPTED">Offer Accepted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Applications List */}
        <div className="space-y-4">
          {applications.length === 0 && !loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  {statusFilter
                    ? `No applications found with status "${statusLabels[statusFilter] || statusFilter}".`
                    : 'You haven\'t applied to any jobs yet. Start by browsing jobs and submitting applications.'
                  }
                  {!statusFilter && (
                    <div className="mt-4">
                      <Button onClick={() => router.push('/jobs')}>
                        Browse Jobs
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3
                      className="text-xl font-semibold mb-2 hover:text-blue-600 cursor-pointer"
                      onClick={() => handleApplicationClick(application.id)}
                    >
                      {application.jobPosting?.title || 'Unknown Position'}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {application.jobPosting?.companyName || 'Unknown Company'}
                    </p>
                    <p className="text-gray-500 mb-2">
                      {application.jobPosting?.location || 'Unknown Location'}
                    </p>
                    <div className="flex items-center gap-4 mb-2">
                      <Badge
                        variant={statusColors[application.status] as any || 'gray'}
                      >
                        {statusLabels[application.status] || application.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Applied on {new Date(application.createdAt).toLocaleDateString()}
                      </span>
                      {application.updatedAt !== application.createdAt && (
                        <span className="text-sm text-gray-500">
                          Updated on {new Date(application.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {application.notes && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {application.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      onClick={() => handleApplicationClick(application.id)}
                    >
                      View Details
                    </Button>
                    {(application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW') && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleWithdrawApplication(application.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
