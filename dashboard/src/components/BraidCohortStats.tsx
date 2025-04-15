import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  useTheme,
  Paper,
  CircularProgress,
} from '@mui/material';
import { BraidVisualizationData } from '../types/braid';
import colors from '../theme/colors';

interface BraidCohortStatsProps {
  data: BraidVisualizationData | null;
  loading?: boolean;
  error?: string | null;
}

const BraidCohortStats: React.FC<BraidCohortStatsProps> = ({
  data,
  loading = false,
  error = null,
}) => {
  const theme = useTheme();

  // Calculate cohort statistics
  const stats = useMemo(() => {
    if (!data) return null;

    // Calculate cohort sizes
    const cohortSizes = data.cohorts.map((cohort) => cohort.length);

    // Find highest work path cohorts
    const highWorkPathNodes = new Set(
      data.links
        .filter((link) => link.isHighWorkPath)
        .flatMap((link) => [link.source, link.target])
    );

    // Calculate various statistics
    const totalCohorts = data.cohorts.length;
    const totalNodes = data.nodes.length;
    const avgCohortsSize =
      cohortSizes.reduce((sum, size) => sum + size, 0) / totalCohorts;
    const maxCohortSize = Math.max(...cohortSizes);
    const minCohortSize = Math.min(...cohortSizes);
    const medianCohortSize = [...cohortSizes].sort((a, b) => a - b)[
      Math.floor(cohortSizes.length / 2)
    ];

    // Count cohorts by size
    const cohortSizeDistribution: { [key: string]: number } = {};
    cohortSizes.forEach((size) => {
      const bucket =
        size === 1
          ? '1'
          : size === 2
          ? '2'
          : size === 3
          ? '3'
          : size <= 5
          ? '4-5'
          : size <= 10
          ? '6-10'
          : size <= 20
          ? '11-20'
          : '20+';
      cohortSizeDistribution[bucket] =
        (cohortSizeDistribution[bucket] || 0) + 1;
    });

    // Count cohorts by nodes in high work path
    const cohortsInHighWorkPath = data.cohorts.filter((cohort) =>
      cohort.some((nodeId) => highWorkPathNodes.has(nodeId))
    ).length;

    return {
      totalCohorts,
      totalNodes,
      avgCohortsSize,
      maxCohortSize,
      minCohortSize,
      medianCohortSize,
      cohortSizeDistribution,
      cohortsInHighWorkPath,
      largestCohorts: cohortSizes
        .map((size, index) => ({ index, size }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 5),
      smallestCohorts: cohortSizes
        .map((size, index) => ({ index, size }))
        .sort((a, b) => a.size - b.size)
        .slice(0, 5),
    };
  }, [data]);

  // Generate distribution chart data
  const distributionData = useMemo(() => {
    if (!stats) return [];

    return Object.entries(stats.cohortSizeDistribution)
      .map(([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / stats.totalCohorts) * 100),
      }))
      .sort((a, b) => {
        // Custom sort to maintain logical order of size buckets
        const order = ['1', '2', '3', '4-5', '6-10', '11-20', '20+'];
        return order.indexOf(a.label) - order.indexOf(b.label);
      });
  }, [stats]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color='error'>{error}</Typography>
      </Box>
    );
  }

  if (!data || !stats) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant='h5' gutterBottom sx={{ color: colors.textPrimary }}>
        Braid Cohort Analysis
      </Typography>
      <Typography variant='body2' sx={{ mb: 3, color: colors.textSecondary }}>
        Comprehensive analysis of DAG cohort structure and distribution
      </Typography>

      {/* Summary metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title='Total Cohorts'
            value={stats.totalCohorts.toString()}
            subtitle='Across entire DAG'
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title='Avg. Size'
            value={stats.avgCohortsSize.toFixed(2)}
            subtitle={`vs ideal: 2.42`}
            color={
              Math.abs(stats.avgCohortsSize - 2.42) < 0.5
                ? theme.palette.success.main
                : theme.palette.warning.main
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title='Max Size'
            value={stats.maxCohortSize.toString()}
            subtitle={`Cohort #${stats.largestCohorts[0]?.index}`}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title='Min Size'
            value={stats.minCohortSize.toString()}
            subtitle={`Cohort #${stats.smallestCohorts[0]?.index}`}
            color='#8e44ad'
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Distribution chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography
                variant='h6'
                gutterBottom
                sx={{ color: colors.textPrimary }}>
                Cohort Size Distribution
              </Typography>
              <Box sx={{ height: 250, mt: 2 }}>
                {distributionData.map((item, index) => (
                  <Box
                    key={index}
                    sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography
                      sx={{ minWidth: 50, color: colors.textSecondary }}>
                      {item.label}:
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        mx: 1,
                        height: 24,
                        position: 'relative',
                      }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: `${item.percentage}%`,
                          height: '100%',
                          bgcolor: theme.palette.primary.main,
                          opacity: 0.7,
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{ minWidth: 60, color: colors.textPrimary }}>
                      {item.count} ({item.percentage}%)
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Interesting cohorts */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography
                variant='h6'
                gutterBottom
                sx={{ color: colors.textPrimary }}>
                Notable Cohorts
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant='subtitle2'
                  sx={{ mb: 1, color: colors.textPrimary }}>
                  Largest Cohorts
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {stats.largestCohorts.map((cohort, index) => (
                    <Chip
                      key={index}
                      label={`#${cohort.index}: ${cohort.size} nodes`}
                      size='small'
                      color='primary'
                      variant='outlined'
                    />
                  ))}
                </Box>

                <Typography
                  variant='subtitle2'
                  sx={{ mb: 1, color: colors.textPrimary }}>
                  Smallest Cohorts
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {stats.smallestCohorts.map((cohort, index) => (
                    <Chip
                      key={index}
                      label={`#${cohort.index}: ${cohort.size} nodes`}
                      size='small'
                      color='secondary'
                      variant='outlined'
                    />
                  ))}
                </Box>

                <Typography
                  variant='subtitle2'
                  sx={{ mb: 1, color: colors.textPrimary }}>
                  High Work Path
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: colors.textSecondary }}>
                  {stats.cohortsInHighWorkPath} cohorts (
                  {(
                    (stats.cohortsInHighWorkPath / stats.totalCohorts) *
                    100
                  ).toFixed(1)}
                  %) are part of the highest work path
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Efficiency analysis */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography
                variant='h6'
                gutterBottom
                sx={{ color: colors.textPrimary }}>
                Braid Efficiency Analysis
              </Typography>
              <Box sx={{ mt: 2 }}>
                <EfficiencyIndicator
                  label='Cohort Size Efficiency'
                  value={(2.42 / stats.avgCohortsSize) * 100}
                  ideal={2.42}
                  actual={stats.avgCohortsSize}
                  description='How close the average cohort size is to the theoretical ideal of 2.42'
                />

                <Divider sx={{ my: 2 }} />

                <EfficiencyIndicator
                  label='Size Consistency'
                  value={
                    100 -
                    ((stats.maxCohortSize - stats.minCohortSize) /
                      stats.maxCohortSize) *
                      100
                  }
                  description='How consistent cohort sizes are across the DAG (higher is better)'
                />

                <Divider sx={{ my: 2 }} />

                <EfficiencyIndicator
                  label='High Work Path Coverage'
                  value={
                    (stats.cohortsInHighWorkPath / stats.totalCohorts) * 100
                  }
                  description='Percentage of cohorts that participate in the highest work path'
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Helper component for stat cards
interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  color = '#3986e8',
}) => (
  <Paper
    elevation={2}
    sx={{ p: 2, height: '100%', borderTop: `3px solid ${color}` }}>
    <Typography variant='body2' sx={{ color: colors.textSecondary }}>
      {title}
    </Typography>
    <Typography variant='h4' sx={{ mt: 1, mb: 0.5, color: colors.textPrimary }}>
      {value}
    </Typography>
    {subtitle && (
      <Typography variant='caption' sx={{ color: colors.textSecondary }}>
        {subtitle}
      </Typography>
    )}
  </Paper>
);

// Helper component for efficiency indicators
interface EfficiencyIndicatorProps {
  label: string;
  value: number;
  ideal?: number;
  actual?: number;
  description: string;
}

const EfficiencyIndicator: React.FC<EfficiencyIndicatorProps> = ({
  label,
  value,
  ideal,
  actual,
  description,
}) => {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

  // Determine color based on value
  let color;
  if (clampedValue >= 90) color = '#27ae60'; // green
  else if (clampedValue >= 70) color = '#2ecc71'; // lighter green
  else if (clampedValue >= 50) color = '#f39c12'; // orange
  else if (clampedValue >= 30) color = '#e67e22'; // darker orange
  else color = '#e74c3c'; // red

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant='body2' sx={{ color: colors.textPrimary }}>
          {label}
        </Typography>
        <Typography variant='body2' sx={{ color: color, fontWeight: 'bold' }}>
          {clampedValue.toFixed(1)}%
          {ideal && actual && (
            <Typography
              component='span'
              variant='caption'
              sx={{ ml: 1, color: colors.textSecondary }}>
              ({actual.toFixed(2)} / {ideal.toFixed(2)})
            </Typography>
          )}
        </Typography>
      </Box>

      <Box
        sx={{
          width: '100%',
          height: 8,
          bgcolor: 'rgba(255,255,255,0.1)',
          borderRadius: 1,
          overflow: 'hidden',
        }}>
        <Box
          sx={{
            height: '100%',
            width: `${clampedValue}%`,
            bgcolor: color,
            transition: 'width 0.5s ease-in-out',
          }}
        />
      </Box>

      <Typography
        variant='caption'
        sx={{ display: 'block', mt: 0.5, color: colors.textSecondary }}>
        {description}
      </Typography>
    </Box>
  );
};

export default BraidCohortStats;
