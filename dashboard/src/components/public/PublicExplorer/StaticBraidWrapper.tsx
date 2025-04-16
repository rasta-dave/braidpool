/**
 * StaticBraidWrapper.tsx
 *
 * A wrapper component for the fully-featured StaticBraidVisualization component.
 * This component is primarily used in the BRAID VISUALIZATION tab, providing a rich
 * interactive experience with the full set of visualization features.
 *
 * Note: For the Overview tab, we use the separate OverviewBraidVisualization component
 * which is a simplified version optimized for that context.
 */

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { mockNetworkStats } from './mock/BraidMockData';
import StaticBraidVisualization from './visualization/StaticBraidVisualization';
import Card from '../../common/Card';

/**
 * A wrapper component that provides a reliable braid visualization
 * for demos without relying on complex data transformations
 */
const StaticBraidWrapper: React.FC<{
  height?: number;
  darkMode?: boolean;
}> = ({ height = 600, darkMode = true }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Card
        title='Braidpool Block Explorer'
        subtitle='Visualizing the Directed Acyclic Graph (DAG) structure'>
        <Box sx={{ p: 1 }}>
          <StaticBraidVisualization height={height} darkMode={darkMode} />

          <Paper
            elevation={2}
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: darkMode
                ? 'rgba(30, 30, 30, 0.6)'
                : 'rgba(245, 245, 245, 0.6)',
            }}>
            <Typography
              variant='subtitle2'
              gutterBottom
              color={darkMode ? 'white' : 'text.primary'}>
              Braidpool Network Statistics
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box>
                <Typography
                  variant='caption'
                  color={darkMode ? 'white' : 'text.secondary'}>
                  Total Nodes
                </Typography>
                <Typography
                  variant='h6'
                  color={darkMode ? 'white' : 'text.primary'}>
                  {mockNetworkStats.nodeCount.toLocaleString()}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant='caption'
                  color={darkMode ? 'white' : 'text.secondary'}>
                  Total Connections
                </Typography>
                <Typography
                  variant='h6'
                  color={darkMode ? 'white' : 'text.primary'}>
                  {mockNetworkStats.linkCount.toLocaleString()}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant='caption'
                  color={darkMode ? 'white' : 'text.secondary'}>
                  Cohorts
                </Typography>
                <Typography
                  variant='h6'
                  color={darkMode ? 'white' : 'text.primary'}>
                  {mockNetworkStats.cohortCount.toLocaleString()}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant='caption'
                  color={darkMode ? 'white' : 'text.secondary'}>
                  Tip Nodes
                </Typography>
                <Typography
                  variant='h6'
                  color={darkMode ? 'white' : 'text.primary'}>
                  {mockNetworkStats.tipCount.toLocaleString()}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant='caption'
                  color={darkMode ? 'white' : 'text.secondary'}>
                  Genesis Nodes
                </Typography>
                <Typography
                  variant='h6'
                  color={darkMode ? 'white' : 'text.primary'}>
                  {mockNetworkStats.genesisCount.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Card>
    </Box>
  );
};

export default StaticBraidWrapper;
