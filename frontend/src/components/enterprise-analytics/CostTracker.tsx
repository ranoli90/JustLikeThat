// Cost Tracker Component
// Sprint 45: Enterprise Analytics & Reporting

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  LinearProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Alert,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Warning,
  Savings,
  Receipt,
  Add,
} from '@mui/icons-material';

interface CostEntry {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'paid';
  vendor?: string;
}

export const CostTracker: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [costSummary, setCostSummary] = useState({
    totalCost: 215000,
    costPerHire: 3209,
    budget: 250000,
    budgetUtilization: 86,
    previousPeriod: 195000,
    change: 10256,
    changePercent: 5.3,
  });

  const [costByCategory] = useState([
    { category: 'Job Boards', amount: 50000, percentage: 23.3, trend: -5 },
    { category: 'Referral Program', amount: 30000, percentage: 14.0, trend: 10 },
    { category: 'Recruitment Agencies', amount: 75000, percentage: 34.9, trend: 15 },
    { category: 'Advertising', amount: 40000, percentage: 18.6, trend: -8 },
    { category: 'Events', amount: 20000, percentage: 9.3, trend: -20 },
  ]);

  const [budgetStatus] = useState({
    totalBudget: 250000,
    spent: 215000,
    remaining: 35000,
    categories: {
      job_board: { budget: 60000, spent: 50000, remaining: 10000 },
      referral: { budget: 40000, spent: 30000, remaining: 10000 },
      agency: { budget: 80000, spent: 75000, remaining: 5000 },
      advertising: { budget: 45000, spent: 40000, remaining: 5000 },
      events: { budget: 25000, spent: 20000, remaining: 5000 },
    },
  });

  const [recentCosts] = useState<CostEntry[]>([
    { id: 'c1', category: 'job_board', description: 'LinkedIn Premium', amount: 15000, date: '2024-01-15', status: 'paid', vendor: 'LinkedIn' },
    { id: 'c2', category: 'agency', description: 'Tech Staffing Fee', amount: 25000, date: '2024-01-14', status: 'approved', vendor: 'TechStaff Inc' },
    { id: 'c3', category: 'referral', description: 'Referral Bonus - J. Smith', amount: 2500, date: '2024-01-13', status: 'pending' },
    { id: 'c4', category: 'advertising', description: 'Indeed Sponsored Jobs', amount: 5000, date: '2024-01-12', status: 'paid', vendor: 'Indeed' },
    { id: 'c5', category: 'job_board', description: 'Glassdoor Listings', amount: 12000, date: '2024-01-11', status: 'pending', vendor: 'Glassdoor' },
  ]);

  const [roiData] = useState({
    avgROI: 850,
    avgPaybackPeriod: 2.5,
    topPerformerROI: 1500,
    underPerformerROI: 200,
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      job_board: '#4F46E5',
      referral: '#10B981',
      agency: '#F59E0B',
      advertising: '#EF4444',
      events: '#8B5CF6',
    };
    return colors[category] || '#6B7280';
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Cost-per-Hire Tracking
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Cost
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AttachMoney color="primary" />
                <Typography variant="subtitle2" color="textSecondary">
                  Total Recruiting Cost
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                ${costSummary.totalCost.toLocaleString()}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                {costSummary.change > 0 ? (
                  <TrendingUp color="error" fontSize="small" />
                ) : (
                  <TrendingDown color="success" fontSize="small" />
                )}
                <Typography variant="body2" color={costSummary.change > 0 ? 'error.main' : 'success.main'}>
                  ${Math.abs(costSummary.change).toLocaleString()} ({Math.abs(costSummary.changePercent)}%) vs last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Savings color="success" />
                <Typography variant="subtitle2" color="textSecondary">
                  Cost per Hire
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                ${costSummary.costPerHire.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Industry avg: $4,129
              </Typography>
              <Chip label="21% below avg" size="small" color="success" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Receipt color="warning" />
                <Typography variant="subtitle2" color="textSecondary">
                  Budget Utilization
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {costSummary.budgetUtilization}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={costSummary.budgetUtilization}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
                color={costSummary.budgetUtilization > 90 ? 'error' : costSummary.budgetUtilization > 80 ? 'warning' : 'success'}
              />
              <Typography variant="caption" color="textSecondary" mt={0.5}>
                ${(costSummary.totalCost / 1000).toFixed(0)}K of ${(costSummary.budget / 1000).toFixed(0)}K
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUp color="info" />
                <Typography variant="subtitle2" color="textSecondary">
                  Average ROI
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {roiData.avgROI}%
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Payback: {roiData.avgPaybackPeriod} months
              </Typography>
              <Chip label="Healthy" size="small" color="success" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Cost Breakdown" />
          <Tab label="Budget Status" />
          <Tab label="ROI Analysis" />
          <Tab label="Recent Costs" />
        </Tabs>

        <CardContent>
          {tab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Cost by Category
                </Typography>
                {costByCategory.map((cat) => (
                  <Box key={cat.category} mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">{cat.category}</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">
                          ${cat.amount.toLocaleString()}
                        </Typography>
                        <Chip
                          label={`${cat.trend > 0 ? '+' : ''}${cat.trend}%`}
                          size="small"
                          color={cat.trend > 0 ? 'error' : 'success'}
                        />
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={cat.percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getCategoryColor(cat.category.toLowerCase().replace(' ', '_')),
                        },
                      }}
                    />
                  </Box>
                ))}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>
                  Budget Alerts
                </Typography>
                <Alert severity="warning" icon={<Warning />} sx={{ mb: 1 }}>
                  Recruitment Agencies budget 94% utilized
                </Alert>
                <Alert severity="info">
                  Events budget 20% underutilized - consider reallocation
                </Alert>
              </Grid>
            </Grid>
          )}

          {tab === 1 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  Budget Status - Q1 2024
                </Typography>
                <Button variant="outlined">Edit Budget</Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Budget</TableCell>
                      <TableCell align="right">Spent</TableCell>
                      <TableCell align="right">Remaining</TableCell>
                      <TableCell>Utilization</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(budgetStatus.categories).map(([key, cat]) => {
                      const utilization = (cat.spent / cat.budget) * 100;
                      return (
                        <TableRow key={key}>
                          <TableCell sx={{ textTransform: 'capitalize' }}>
                            {key.replace('_', ' ')}
                          </TableCell>
                          <TableCell align="right">
                            ${cat.budget.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            ${cat.spent.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              color={cat.remaining < 0 ? 'error.main' : 'success.main'}
                              fontWeight="bold"
                            >
                              ${cat.remaining.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(utilization, 100)}
                                sx={{ flex: 1, height: 6, borderRadius: 3 }}
                                color={utilization > 90 ? 'error' : utilization > 75 ? 'warning' : 'success'}
                              />
                              <Typography variant="caption">
                                {utilization.toFixed(0)}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {tab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  ROI by Source
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Source</TableCell>
                        <TableCell align="right">Avg ROI</TableCell>
                        <TableCell align="right">Avg Payback</TableCell>
                        <TableCell align="right">Hires</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Referral</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                          1200%
                        </TableCell>
                        <TableCell align="right">1.5 mo</TableCell>
                        <TableCell align="right">120</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Career Site</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                          900%
                        </TableCell>
                        <TableCell align="right">2.0 mo</TableCell>
                        <TableCell align="right">80</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Job Boards</TableCell>
                        <TableCell align="right">750%</TableCell>
                        <TableCell align="right">3.0 mo</TableCell>
                        <TableCell align="right">150</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Agencies</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                          400%
                        </TableCell>
                        <TableCell align="right">4.5 mo</TableCell>
                        <TableCell align="right">40</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Recommendations
                </Typography>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Increase Referrals</Typography>
                  <Typography variant="body2">
                    Referrals have the highest ROI (1200%). Consider increasing referral bonuses.
                  </Typography>
                </Alert>
                <Alert severity="warning">
                  <Typography variant="subtitle2">Review Agency Usage</Typography>
                  <Typography variant="body2">
                    Agencies have lower ROI (400%). Use for critical roles only.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}

          {tab === 3 && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentCosts.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>{cost.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={cost.category.replace('_', ' ')}
                          size="small"
                          sx={{
                            backgroundColor: `${getCategoryColor(cost.category)  }20`,
                            color: getCategoryColor(cost.category),
                          }}
                        />
                      </TableCell>
                      <TableCell>{cost.vendor || '-'}</TableCell>
                      <TableCell>{cost.date}</TableCell>
                      <TableCell align="right" fontWeight="bold">
                        ${cost.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={cost.status}
                          size="small"
                          color={
                            cost.status === 'paid' ? 'success' :
                            cost.status === 'approved' ? 'info' : 'default'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add Cost Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Cost</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select defaultValue="" label="Category">
              <MenuItem value="job_board">Job Board</MenuItem>
              <MenuItem value="referral">Referral</MenuItem>
              <MenuItem value="agency">Agency</MenuItem>
              <MenuItem value="advertising">Advertising</MenuItem>
              <MenuItem value="events">Events</MenuItem>
              <MenuItem value="technology">Technology</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth label="Description" sx={{ mt: 2 }} />
          <TextField fullWidth label="Amount" type="number" sx={{ mt: 2 }} />
          <TextField fullWidth label="Vendor" sx={{ mt: 2 }} />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Hire/Job Reference (Optional)</InputLabel>
            <Select defaultValue="" label="Hire/Job Reference (Optional)">
              <MenuItem value="">None</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setAddDialogOpen(false)}>
            Add Cost
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CostTracker;
