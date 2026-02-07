import api from './api';

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore: number;
  reasons: string[];
  applyUrl?: string;
}

export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  date: string;
}

export interface DashboardMetrics {
  totalMatches: number;
  activeApplications: number;
  interviews: number;
  offers: number;
}

export interface DashboardData {
  jobMatches: JobMatch[];
  applications: Application[];
  metrics: DashboardMetrics;
}

class DashboardService {
  /**
   * Get job matches for the current user
   */
  async getJobMatches(limit = 10): Promise<JobMatch[]> {
    try {
      // First get user's matching persona/profile
      const userProfile = await api.getCurrentUser();
      if (!userProfile?.id) {
        throw new Error('User not authenticated');
      }

      // Get job matches using matching service
      const matches = await api.get('/api/v1/matching/jobs', {
        limit,
        userId: userProfile.id
      });

      // Transform to expected format
      return matches.map((match: any) => ({
        id: match.jobPosting?.id || match.id,
        title: match.jobPosting?.title || match.title,
        company: match.jobPosting?.companyName || match.company,
        location: match.jobPosting?.location || match.location || 'Remote',
        matchScore: match.score || match.matchScore || 0,
        reasons: match.reasons || [],
        applyUrl: match.jobPosting?.applicationUrl || '#'
      }));
    } catch (error) {
      console.error('Failed to fetch job matches:', error);
      // Return empty array on error to prevent dashboard crash
      return [];
    }
  }

  /**
   * Get user's applications
   */
  async getApplications(limit = 10): Promise<Application[]> {
    try {
      const applications = await api.getApplications({
        page: 1,
        limit
      });

      // Transform to expected format
      return applications.map((app: any) => ({
        id: app.id,
        jobTitle: app.jobPosting?.title || app.jobTitle || 'Unknown Position',
        company: app.jobPosting?.companyName || app.company || 'Unknown Company',
        status: app.status || 'Unknown',
        date: app.createdAt ? new Date(app.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      return [];
    }
  }

  /**
   * Get dashboard metrics
   */
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      // Get metrics from analytics service
      const metrics = await api.get('/api/v1/analytics/metrics/dashboard');

      return {
        totalMatches: metrics.totalMatches || 0,
        activeApplications: metrics.activeApplications || 0,
        interviews: metrics.interviews || 0,
        offers: metrics.offers || 0
      };
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      // Return default metrics on error
      return {
        totalMatches: 0,
        activeApplications: 0,
        interviews: 0,
        offers: 0
      };
    }
  }

  /**
   * Get all dashboard data in one call
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const [jobMatches, applications, metrics] = await Promise.all([
        this.getJobMatches(),
        this.getApplications(),
        this.getMetrics()
      ]);

      return {
        jobMatches,
        applications,
        metrics
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Return empty data on error
      return {
        jobMatches: [],
        applications: [],
        metrics: {
          totalMatches: 0,
          activeApplications: 0,
          interviews: 0,
          offers: 0
        }
      };
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
