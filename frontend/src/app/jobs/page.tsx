'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import api from '../../../services/api';

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
  postedAt: string;
  applicationDeadline?: string;
  employmentType: string;
  experienceLevel: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    employmentType: '',
    experienceLevel: '',
    salaryMin: '',
  });

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Initialize filters from URL params
    const query = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const employmentType = searchParams.get('employmentType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const salaryMin = searchParams.get('salaryMin') || '';

    setSearchQuery(query);
    setFilters({
      location,
      employmentType,
      experienceLevel,
      salaryMin,
    });

    fetchJobs({
      query,
      location,
      employmentType,
      experienceLevel,
      salaryMin,
    });
  }, [searchParams]);

  const fetchJobs = async (params: Record<string, string>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.searchJobs(params.query || '', {
        location: params.location || undefined,
        employmentType: params.employmentType || undefined,
        experienceLevel: params.experienceLevel || undefined,
        salaryMin: params.salaryMin ? parseInt(params.salaryMin) : undefined,
        page: 1,
        limit: 20,
      });

      setJobs(response.jobs || []);
    } catch (err: any) {
      console.error('Failed to fetch jobs:', err);
      setError(err.message || 'Failed to fetch jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filters.location) params.set('location', filters.location);
    if (filters.employmentType) params.set('employmentType', filters.employmentType);
    if (filters.experienceLevel) params.set('experienceLevel', filters.experienceLevel);
    if (filters.salaryMin) params.set('salaryMin', filters.salaryMin);

    router.push(`/jobs?${params.toString()}`);
  };

  const handleJobClick = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Job Search</h1>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Input
                placeholder="Location"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              />
              <Select
                value={filters.employmentType}
                onValueChange={(value) => setFilters({ ...filters, employmentType: value })}
              >
                <option value="">All Employment Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="FREELANCE">Freelance</option>
              </Select>
              <Select
                value={filters.experienceLevel}
                onValueChange={(value) => setFilters({ ...filters, experienceLevel: value })}
              >
                <option value="">All Experience Levels</option>
                <option value="ENTRY">Entry Level</option>
                <option value="MID">Mid Level</option>
                <option value="SENIOR">Senior Level</option>
                <option value="EXECUTIVE">Executive</option>
              </Select>
            </div>
            <Button onClick={handleSearch} className="w-full md:w-auto">
              Search Jobs
            </Button>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Job Results */}
        <div className="space-y-4">
          {jobs.length === 0 && !loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  No jobs found matching your criteria. Try adjusting your search filters.
                </div>
              </CardContent>
            </Card>
          )}

          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3
                      className="text-xl font-semibold mb-2 hover:text-blue-600"
                      onClick={() => handleJobClick(job.id)}
                    >
                      {job.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{job.companyName}</p>
                    <p className="text-gray-500 mb-2">{job.location}</p>
                    <div className="flex gap-2 mb-3">
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
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {job.description}
                    </p>
                  </div>
                  <Button onClick={() => handleJobClick(job.id)}>
                    View Details
                  </Button>
                </div>
                <div className="text-sm text-gray-500">
                  Posted {new Date(job.postedAt).toLocaleDateString()}
                  {job.applicationDeadline && (
                    <> • Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
