'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Alert } from '../../../../components/ui/Alert';
import api from '../../../../services/api';

interface JobPosting {
  id: string;
  title: string;
  companyName: string;
  location: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  postedAt: string;
  applicationDeadline?: string;
  employmentType: string;
  experienceLevel: string;
  company?: {
    name: string;
    description?: string;
    website?: string;
  };
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails(jobId);
    }
  }, [jobId]);

  const fetchJobDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const jobData = await api.getJob(id);
      setJob(jobData);
    } catch (err: any) {
      console.error('Failed to fetch job details:', err);
      setError(err.message || 'Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!job) return;

    try {
      setApplying(true);

      // Create application
      const application = await api.createApplication({
        jobPostingId: job.id,
      });

      // Submit the application
      await api.submitApplication(application.id);

      // Redirect to applications page or show success message
      router.push('/applications');
    } catch (err: any) {
      console.error('Failed to apply for job:', err);
      setError(err.message || 'Failed to apply for job');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading job details...</div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          {error || 'Job not found'}
        </Alert>
        <Button onClick={() => router.push('/jobs')}>
          Back to Jobs
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
          onClick={() => router.push('/jobs')}
          className="mb-4"
        >
          ← Back to Jobs
        </Button>

        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
            <p className="text-xl text-gray-600 mb-2">{job.companyName}</p>
            <p className="text-lg text-gray-500 mb-4">{job.location}</p>

            <div className="flex gap-2 mb-4">
              <Badge variant="secondary">{job.employmentType}</Badge>
              <Badge variant="outline">{job.experienceLevel}</Badge>
              {job.salary && (
                <Badge variant="outline">
                  {job.salary.currency || '$'}
                  {job.salary.min ? `${job.salary.min.toLocaleString()}` : '0'}
                  {job.salary.max ? ` - ${job.salary.max.toLocaleString()}` : '+'}
                </Badge>
              )}
            </div>
          </div>

          <Button
            onClick={handleApply}
            disabled={applying}
            className="ml-4"
          >
            {applying ? 'Applying...' : 'Apply Now'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{job.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {job.responsibilities.map((responsibility, index) => (
                    <li key={index}>{responsibility}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {job.requirements.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {job.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Employment Type</p>
                  <p className="text-gray-600">{job.employmentType}</p>
                </div>
                <div>
                  <p className="font-medium">Experience Level</p>
                  <p className="text-gray-600">{job.experienceLevel}</p>
                </div>
                <div>
                  <p className="font-medium">Posted</p>
                  <p className="text-gray-600">{new Date(job.postedAt).toLocaleDateString()}</p>
                </div>
                {job.applicationDeadline && (
                  <div>
                    <p className="font-medium">Application Deadline</p>
                    <p className="text-gray-600">{new Date(job.applicationDeadline).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Info */}
          {job.company && (
            <Card>
              <CardHeader>
                <CardTitle>About {job.companyName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {job.company.description && (
                    <p className="text-gray-600">{job.company.description}</p>
                  )}
                  {job.company.website && (
                    <a
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Visit Company Website
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Apply Again */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleApply}
                disabled={applying}
                className="w-full"
              >
                {applying ? 'Applying...' : 'Apply Now'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
