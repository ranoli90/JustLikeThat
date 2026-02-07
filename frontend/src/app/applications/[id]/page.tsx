'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Alert } from '../../../../components/ui/Alert';
import { Textarea } from '../../../../components/ui/Textarea';
import api from '../../../../services/api';

interface Application {
  id: string;
  jobPosting: {
    id: string;
    title: string;
    companyName: string;
    location: string;
    description: string;
    requirements: string[];
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  resumeId?: string;
  coverLetter?: string;
  notes?: string;
  feedback?: string;
  interviewScheduledAt?: string;
  interviewNotes?: string;
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

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetails(applicationId);
    }
  }, [applicationId]);

  const fetchApplicationDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const applicationData = await api.getApplication(id);
      setApplication(applicationData);
      setNotes(applicationData.notes || '');
    } catch (err: any) {
      console.error('Failed to fetch application details:', err);
      setError(err.message || 'Failed to fetch application details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!application) return;

    try {
      setUpdating(true);

      await api.updateApplication(application.id, { notes });
      setApplication({ ...application, notes });

      // Show success message (you could add a toast here)
      alert('Notes updated successfully!');
    } catch (err: any) {
      console.error('Failed to update notes:', err);
      setError(err.message || 'Failed to update notes');
    } finally {
      setUpdating(false);
    }
  };

  const handleWithdrawApplication = async () => {
    if (!application) return;

    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    try {
      setUpdating(true);

      await api.withdrawApplication(application.id);

      // Refresh application data
      fetchApplicationDetails(application.id);
    } catch (err: any) {
      console.error('Failed to withdraw application:', err);
      setError(err.message || 'Failed to withdraw application');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewJob = () => {
    if (application?.jobPosting?.id) {
      router.push(`/jobs/${application.jobPosting.id}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading application details...</div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          {error || 'Application not found'}
        </Alert>
        <Button onClick={() => router.push('/applications')}>
          Back to Applications
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => router.push('/applications')}
          className="mb-4"
        >
          ← Back to Applications
        </Button>

        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{application.jobPosting.title}</h1>
            <p className="text-xl text-gray-600 mb-2">{application.jobPosting.companyName}</p>
            <p className="text-lg text-gray-500 mb-4">{application.jobPosting.location}</p>

            <div className="flex items-center gap-4 mb-4">
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
                  Last updated on {new Date(application.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <Button variant="outline" onClick={handleViewJob}>
              View Job Posting
            </Button>
            {(application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW') && (
              <Button
                variant="destructive"
                onClick={handleWithdrawApplication}
                disabled={updating}
              >
                {updating ? 'Withdrawing...' : 'Withdraw Application'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Status</p>
                  <Badge
                    variant={statusColors[application.status] as any || 'gray'}
                    className="mt-1"
                  >
                    {statusLabels[application.status] || application.status}
                  </Badge>
                </div>

                {application.resumeId && (
                  <div>
                    <p className="font-medium">Resume Submitted</p>
                    <p className="text-gray-600">Resume ID: {application.resumeId}</p>
                  </div>
                )}

                {application.coverLetter && (
                  <div>
                    <p className="font-medium">Cover Letter</p>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="whitespace-pre-wrap">{application.coverLetter}</p>
                    </div>
                  </div>
                )}

                {application.feedback && (
                  <div>
                    <p className="font-medium">Feedback from Employer</p>
                    <div className="mt-2 p-4 bg-blue-50 rounded-lg">
                      <p className="whitespace-pre-wrap">{application.feedback}</p>
                    </div>
                  </div>
                )}

                {application.interviewScheduledAt && (
                  <div>
                    <p className="font-medium">Interview Scheduled</p>
                    <p className="text-gray-600">
                      {new Date(application.interviewScheduledAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {application.interviewNotes && (
                  <div>
                    <p className="font-medium">Interview Notes</p>
                    <div className="mt-2 p-4 bg-purple-50 rounded-lg">
                      <p className="whitespace-pre-wrap">{application.interviewNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{application.jobPosting.description}</p>
              </div>
              {application.jobPosting.requirements && application.jobPosting.requirements.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium mb-2">Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {application.jobPosting.requirements.map((req, index) => (
                      <li key={index} className="text-gray-600">{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Add your personal notes about this application..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <Button
                  onClick={handleUpdateNotes}
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Application Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Application Submitted</p>
                    <p className="text-sm text-gray-500">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {application.status !== 'SUBMITTED' && application.updatedAt !== application.createdAt && (
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      application.status === 'REJECTED' ? 'bg-red-500' :
                      application.status === 'OFFER_RECEIVED' || application.status === 'OFFER_ACCEPTED' ? 'bg-green-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">Status Updated</p>
                      <p className="text-sm text-gray-500">
                        {new Date(application.updatedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {statusLabels[application.status] || application.status}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={handleViewJob}
                  className="w-full"
                >
                  View Original Job Posting
                </Button>

                {(application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW') && (
                  <Button
                    variant="destructive"
                    onClick={handleWithdrawApplication}
                    disabled={updating}
                    className="w-full"
                  >
                    {updating ? 'Withdrawing...' : 'Withdraw Application'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
