import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';

interface StatsProps {
  stats: {
    totalNodes: number;
    visibleNodes: number;
    totalCohorts: number;
    visibleCohorts: number;
    cohortSizeDistribution: Record<string, number>;
  };
  distributionData: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
}

const Stats: React.FC<StatsProps> = ({ stats, distributionData }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        maxWidth: 300,
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        zIndex: 10,
        maxHeight: '80vh',
        overflow: 'auto',
      }}>
      <Typography variant='h6' gutterBottom>
        Visualization Stats
      </Typography>

      <Divider sx={{ my: 1 }} />

      <List dense>
        <ListItem>
          <ListItemText
            primary='Total Nodes'
            secondary={stats.totalNodes.toLocaleString()}
          />
        </ListItem>

        <ListItem>
          <ListItemText
            primary='Visible Nodes'
            secondary={`${stats.visibleNodes.toLocaleString()} (${
              Math.round((stats.visibleNodes / stats.totalNodes) * 100) || 0
            }%)`}
          />
        </ListItem>

        <ListItem>
          <ListItemText
            primary='Total Cohorts'
            secondary={stats.totalCohorts.toLocaleString()}
          />
        </ListItem>

        <ListItem>
          <ListItemText
            primary='Visible Cohorts'
            secondary={`${stats.visibleCohorts.toLocaleString()} (${
              Math.round((stats.visibleCohorts / stats.totalCohorts) * 100) || 0
            }%)`}
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 1 }} />

      <Typography variant='subtitle1' gutterBottom>
        Cohort Size Distribution
      </Typography>

      {distributionData.length > 0 ? (
        <Box sx={{ mt: 1 }}>
          {distributionData.map((item) => (
            <Box key={item.label} sx={{ mb: 1 }}>
              <Typography
                variant='body2'
                sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.label} nodes:</span>
                <span>
                  {item.count} ({item.percentage}%)
                </span>
              </Typography>
              <Box
                sx={{
                  height: 6,
                  width: '100%',
                  backgroundColor: 'rgba(80, 80, 80, 0.3)',
                  borderRadius: 1,
                }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${item.percentage}%`,
                    backgroundColor: 'primary.main',
                    borderRadius: 1,
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant='body2' color='text.secondary'>
          No distribution data available
        </Typography>
      )}
    </Paper>
  );
};

export default Stats;
