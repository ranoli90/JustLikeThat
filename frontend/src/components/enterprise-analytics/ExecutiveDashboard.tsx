// Executive Dashboard Component
// Sprint 45: Enterprise Analytics & Reporting

import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Card, Typography, Button, Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import { Refresh as RefreshIcon, Download as DownloadIcon, Settings as SettingsIcon, Fullscreen as FullscreenIcon } from '@mui/icons-material';
import { KPIWidget } from './widgets/KPIWidget';
import { ChartWidget } from './widgets/ChartWidget';
import { TableWidget } from './widgets/TableWidget';
import { FunnelWidget } from './widgets/FunnelWidget';
import { useAnalytics } from '../../hooks/useAnalytics';

interface DashboardProps {
  dashboardId?: string;
  tenantId: string;
  userId: string;
  onWidgetClick?: (widgetId: string) => void;
}

interface Widget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'funnel' | 'gauge' | 'heatmap';
  title: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
  dataSource: any;
}

export const ExecutiveDashboard: React.FC<DashboardProps> = ({
  dashboardId,
  tenantId,
  userId,
  onWidgetClick,
}) => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ preset: 'this_month' });
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { getDashboard, getKPIWidgets, exportDashboard } = useAnalytics();

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (dashboardId) {
        const dashboardData = await getDashboard(dashboardId);
        setDashboard(dashboardData);
        setWidgets(dashboardData.widgets || []);
      } else {
        // Create default dashboard with KPI widgets
        setWidgets(getDefaultWidgets());
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [dashboardId, getDashboard]);

  // Load KPI data
  const loadKPIWidgets = useCallback(async () => {
    try {
      const kpis = await getKPIWidgets(tenantId, dateRange);
      setWidgets(prev => prev.map(widget => {
        if (widget.type === 'kpi') {
          const kpiData = kpis.find((k: any) => k.id === widget.id);
          return kpiData ? { ...widget, data: kpiData } : widget;
        }
        return widget;
      }));
    } catch (err) {
      console.error('Failed to load KPI widgets:', err);
    }
  }, [tenantId, dateRange, getKPIWidgets]);

  // Initial load
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadKPIWidgets();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadKPIWidgets]);

  // Handle export
  const handleExport = async (format: 'pdf' | 'excel' | 'png') => {
    try {
      await exportDashboard(dashboardId || 'default', format);
    } catch (err: any) {
      setError(err.message || 'Failed to export dashboard');
    }
  };

  // Handle date range change
  const handleDateRangeChange = (newRange: any) => {
    setDateRange(newRange);
    loadKPIWidgets();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Executive Dashboard
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange.preset}
              label="Date Range"
              onChange={(e) => handleDateRangeChange({ preset: e.target.value })}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="this_week">This Week</MenuItem>
              <MenuItem value="this_month">This Month</MenuItem>
              <MenuItem value="last_30_days">Last 30 Days</MenuItem>
              <MenuItem value="this_quarter">This Quarter</MenuItem>
              <MenuItem value="this_year">This Year</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Refresh">
            <IconButton onClick={loadKPIWidgets}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('pdf')}
          >
            Export PDF
          </Button>

          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
          >
            Customize
          </Button>
        </Box>
      </Box>

      {/* KPI Row */}
      <Grid container spacing={2} mb={3}>
        {widgets.filter(w => w.type === 'kpi').slice(0, 8).map((widget) => (
          <Grid item xs={12} sm={6} md={3} key={widget.id}>
            <KPIWidget
              widget={widget}
              onClick={() => onWidgetClick?.(widget.id)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Applications Trend
            </Typography>
            <ChartWidget
              type="line"
              data={generateTrendData()}
              height={320}
            />
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Source Breakdown
            </Typography>
            <ChartWidget
              type="pie"
              data={generateSourceData()}
              height={320}
            />
          </Card>
        </Grid>
      </Grid>

      {/* Pipeline and Funnel */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Pipeline Funnel
            </Typography>
            <FunnelWidget data={generateFunnelData()} />
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Time to Fill by Stage
            </Typography>
            <ChartWidget
              type="bar"
              data={generateStageDurationData()}
              height={320}
            />
          </Card>
        </Grid>
      </Grid>

      {/* Tables Row */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Performing Sources
            </Typography>
            <TableWidget
              columns={[
                { field: 'source', header: 'Source' },
                { field: 'applications', header: 'Applications' },
                { field: 'hires', header: 'Hires' },
                { field: 'conversion', header: 'Conversion' },
                { field: 'costPerHire', header: 'Cost/Hire' },
              ]}
              data={generateTopSourcesData()}
            />
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recruiter Performance
            </Typography>
            <TableWidget
              columns={[
                { field: 'name', header: 'Name' },
                { field: 'filled', header: 'Positions' },
                { field: 'avgTime', header: 'Avg Time' },
                { field: 'quality', header: 'Quality' },
              ]}
              data={generateRecruiterData()}
            />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Helper functions for demo data
const getDefaultWidgets = (): Widget[] => [
  { id: 'total-applications', type: 'kpi', title: 'Total Applications', config: {}, position: { x: 0, y: 0, w: 3, h: 1 }, dataSource: {} },
  { id: 'active-jobs', type: 'kpi', title: 'Active Jobs', config: {}, position: { x: 3, y: 0, w: 3, h: 1 }, dataSource: {} },
  { id: 'time-to-fill', type: 'kpi', title: 'Avg Time to Fill', config: {}, position: { x: 6, y: 0, w: 3, h: 1 }, dataSource: {} },
  { id: 'cost-per-hire', type: 'kpi', title: 'Cost per Hire', config: {}, position: { x: 9, y: 0, w: 3, h: 1 }, dataSource: {} },
];

const generateTrendData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return {
    labels: months,
    datasets: [
      { label: 'Applications', data: [1200, 1350, 1100, 1450, 1600, 1550], borderColor: '#4F46E5' },
      { label: 'Hires', data: [45, 52, 48, 55, 60, 58], borderColor: '#10B981' },
    ],
  };
};

const generateSourceData = () => ({
  labels: ['LinkedIn', 'Indeed', 'Referral', 'Career Site', 'Other'],
  datasets: [{
    data: [35, 25, 20, 15, 5],
    backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6B7280'],
  }],
});

const generateFunnelData = () => [
  { stage: 'Applications', count: 10000, percentage: 100 },
  { stage: 'Screening', count: 5000, percentage: 50 },
  { stage: 'Interview', count: 2000, percentage: 20 },
  { stage: 'Offer', count: 500, percentage: 5 },
  { stage: 'Hire', count: 250, percentage: 2.5 },
];

const generateStageDurationData = () => ({
  labels: ['Application', 'Screening', 'Interview', 'Offer', 'Background'],
  datasets: [{
    label: 'Days',
    data: [2, 3, 7, 4, 4],
    backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  }],
});

const generateTopSourcesData = () => [
  { source: 'LinkedIn', applications: 3500, hires: 150, conversion: '4.3%', costPerHire: 333 },
  { source: 'Referral', applications: 1500, hires: 120, conversion: '8.0%', costPerHire: 250 },
  { source: 'Indeed', applications: 2000, hires: 80, conversion: '4.0%', costPerHire: 375 },
  { source: 'Career Site', applications: 1000, hires: 50, conversion: '5.0%', costPerHire: 100 },
];

const generateRecruiterData = () => [
  { name: 'Sarah Johnson', filled: 25, avgTime: '22 days', quality: 92 },
  { name: 'Michael Chen', filled: 22, avgTime: '25 days', quality: 89 },
  { name: 'Emily Davis', filled: 20, avgTime: '24 days', quality: 91 },
  { name: 'James Wilson', filled: 18, avgTime: '28 days', quality: 87 },
  { name: 'Lisa Brown', filled: 15, avgTime: '26 days', quality: 90 },
];

export default ExecutiveDashboard;
