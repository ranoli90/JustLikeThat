// Workforce Predictions Component
// Sprint 45: Enterprise Analytics & Reporting

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  Slider,
} from '@mui/material';
import { TrendingUp, TrendingDown, Warning, Info } from '@mui/icons-material';

interface PredictionCardProps {
  title: string;
  value: number;
  previousValue?: number;
  unit?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  factors?: { name: string; weight: number }[];
  onClick?: () => void;
}

const PredictionCard: React.FC<PredictionCardProps> = ({
  title,
  value,
  previousValue,
  unit,
  riskLevel,
  factors,
  onClick,
}) => {
  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositive = change > 0;

  const riskColors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#991B1B',
  };

  return (
    <Card sx={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <CardContent>
        <Typography variant="subtitle2" color="textSecondary">
          {title}
        </Typography>
        <Box display="flex" alignItems="baseline" gap={1} mt={1}>
          <Typography variant="h4" fontWeight="bold">
            {value}{unit || '%'}
          </Typography>
          {previousValue !== undefined && (
            <Box display="flex" alignItems="center" color={isPositive ? 'error.main' : 'success.main'}>
              {isPositive ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
              <Typography variant="body2">
                {Math.abs(change).toFixed(1)}%
              </Typography>
            </Box>
          )}
        </Box>
        {riskLevel && (
          <Chip
            label={riskLevel.toUpperCase()}
            size="small"
            sx={{
              mt: 1,
              backgroundColor: `${riskColors[riskLevel]  }20`,
              color: riskColors[riskLevel],
              fontWeight: 'bold',
            }}
          />
        )}
        {factors && factors.length > 0 && (
          <Box mt={2}>
            <Typography variant="caption" color="textSecondary">
              Contributing Factors
            </Typography>
            {factors.slice(0, 3).map((factor, index) => (
              <Box key={index} display="flex" alignItems="center" gap={1} mt={0.5}>
                <LinearProgress
                  variant="determinate"
                  value={factor.weight * 100}
                  sx={{ flex: 1, height: 4, borderRadius: 2 }}
                />
                <Typography variant="caption" sx={{ minWidth: 80 }}>
                  {factor.name} ({factor.weight.toFixed(2)})
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

interface SkillsGap {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  priority: string;
}

const SkillsGapChart: React.FC<{ data: SkillsGap[] }> = ({ data }) => {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Skill</TableCell>
            <TableCell align="right">Current</TableCell>
            <TableCell align="right">Required</TableCell>
            <TableCell align="right">Gap</TableCell>
            <TableCell align="right">Priority</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.skill}</TableCell>
              <TableCell align="right">{row.currentLevel}</TableCell>
              <TableCell align="right">{row.requiredLevel}</TableCell>
              <TableCell align="right">
                <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                  <Box
                    sx={{
                      width: row.gap * 10,
                      height: 10,
                      backgroundColor: 'error.main',
                      borderRadius: 1,
                    }}
                  />
                  {row.gap}
                </Box>
              </TableCell>
              <TableCell align="right">
                <Chip
                  label={row.priority}
                  size="small"
                  color={row.priority === 'critical' ? 'error' : row.priority === 'high' ? 'warning' : 'default'}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const WorkforcePredictions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('1y');
  const [predictions, setPredictions] = useState({
    attrition: { current: 12, previous: 10, riskLevel: 'medium' as const },
    retention: { current: 88, previous: 90, riskLevel: 'low' as const },
  });
  const [skillsGaps, setSkillsGaps] = useState<SkillsGap[]>([]);
  const [talentForecast, setTalentForecast] = useState<any>(null);
  const [diversity, setDiversity] = useState<any>(null);

  useEffect(() => {
    // Load prediction data
    const loadData = async () => {
      setLoading(true);
      // Simulated data - in production, fetch from API
      setPredictions({
        attrition: { current: 12, previous: 10, riskLevel: 'medium' },
        retention: { current: 88, previous: 90, riskLevel: 'low' },
      });

      setSkillsGaps([
        { skill: 'Machine Learning', currentLevel: 2, requiredLevel: 4, gap: 2, priority: 'critical' },
        { skill: 'Cloud Architecture', currentLevel: 3, requiredLevel: 4, gap: 1, priority: 'high' },
        { skill: 'Data Engineering', currentLevel: 2, requiredLevel: 4, gap: 2, priority: 'high' },
        { skill: 'DevOps', currentLevel: 3, requiredLevel: 3, gap: 0, priority: 'medium' },
        { skill: 'Cybersecurity', currentLevel: 2, requiredLevel: 3, gap: 1, priority: 'medium' },
      ]);

      setTalentForecast({
        current: 865,
        projected: 920,
        attritionRate: 10,
        hiringRate: 75,
        confidence: 85,
      });

      setDiversity({
        gender: { male: 52, female: 44, other: 4 },
        ethnicity: { white: 60, asian: 21, hispanic: 10, black: 6, other: 3 },
        goals: { gender: { target: 50, current: 44 }, ethnicity: { target: 15, current: 12 } },
      });

      setLoading(false);
    };

    loadData();
  }, [period]);

  const attritionFactors = [
    { name: 'Compensation', weight: 0.25 },
    { name: 'Work-Life Balance', weight: 0.20 },
    { name: 'Career Growth', weight: 0.18 },
    { name: 'Management', weight: 0.15 },
    { name: 'Tenure', weight: 0.12 },
  ];

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Workforce Predictions
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Forecast Period</InputLabel>
          <Select value={period} label="Forecast Period" onChange={(e) => setPeriod(e.target.value)}>
            <MenuItem value="3m">3 Months</MenuItem>
            <MenuItem value="6m">6 Months</MenuItem>
            <MenuItem value="1y">1 Year</MenuItem>
            <MenuItem value="3y">3 Years</MenuItem>
            <MenuItem value="5y">5 Years</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Prediction accuracy: 85% | Model: v2.1.0 | Last updated: Today
        </Typography>
      </Alert>

      {/* Prediction Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <PredictionCard
            title="Predicted Attrition Rate"
            value={predictions.attrition.current}
            previousValue={predictions.attrition.previous}
            riskLevel={predictions.attrition.riskLevel}
            factors={attritionFactors}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <PredictionCard
            title="Retention Rate"
            value={predictions.retention.current}
            previousValue={predictions.retention.previous}
            riskLevel={predictions.retention.riskLevel}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Talent Forecast
              </Typography>
              <Typography variant="h4" fontWeight="bold" mt={1}>
                {talentForecast.projected}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Current: {talentForecast.current}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip label={`+${talentForecast.projected - talentForecast.current} projected`} size="small" color="success" />
                <Chip label={`${talentForecast.confidence}% confidence`} size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Skills Gap Score
              </Typography>
              <Typography variant="h4" fontWeight="bold" mt={1}>
                3.5
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Out of 5.0
              </Typography>
              <Box mt={1}>
                <Slider
                  value={3.5}
                  min={0}
                  max={5}
                  disabled
                  sx={{ color: 'warning.main' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Skills Gap Analysis */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Skills Gap Analysis
          </Typography>
          <SkillsGapChart data={skillsGaps} />
        </CardContent>
      </Card>

      {/* Diversity & Talent Forecast */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Diversity Metrics
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Gender</Typography>
                  <Box mt={1}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">Male</Typography>
                      <Typography variant="body2">{diversity.gender.male}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={diversity.gender.male} />
                  </Box>
                  <Box mt={1}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">Female</Typography>
                      <Typography variant="body2">{diversity.gender.female}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={diversity.gender.female} color="secondary" />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Goals Progress</Typography>
                  <Box mt={1}>
                    <Typography variant="body2">Gender Parity</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(diversity.goals.gender.current / diversity.goals.gender.target) * 100}
                      color="success"
                    />
                    <Typography variant="caption" color="textSecondary">
                      {diversity.goals.gender.current}% / {diversity.goals.gender.target}% target
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compensation Benchmark
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Market Position</TableCell>
                      <TableCell align="right">Competitive</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>vs Market P50</TableCell>
                      <TableCell align="right">+5%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Critical Roles Gap</TableCell>
                      <TableCell align="right">-12%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Recommended Adjustment</TableCell>
                      <TableCell align="right">+8%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Items */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recommended Actions
          </Typography>
          <Grid container spacing={2} mt={1}>
            {[
              { action: 'Review compensation for critical roles', impact: 'High', effort: 'Medium' },
              { action: 'Implement mentorship program', impact: 'Medium', effort: 'Low' },
              { action: 'Address ML skills gap through training', impact: 'High', effort: 'High' },
              { action: 'Enhance employee engagement initiatives', impact: 'Medium', effort: 'Medium' },
            ].map((item, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body1">{item.action}</Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip label={`Impact: ${item.impact}`} size="small" color="primary" />
                    <Chip label={`Effort: ${item.effort}`} size="small" variant="outlined" />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WorkforcePredictions;
