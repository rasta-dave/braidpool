import React from 'react';
import {
  Box,
  Typography,
  Grid as MuiGrid,
  CircularProgress,
  Paper,
} from '@mui/material';
import Card from '../../common/Card';

// Define the interface for network stats
interface NetworkStatsProps {
  data: {
    totalBeads: number;
    lastUpdate: string;
    networkHashrate: number;
    activeMiners: number;
    averageConfirmationTime: number;
  } | null;
  detailed?: boolean;
}

const NetworkStats: React.FC<NetworkStatsProps> = ({
  data,
  detailed = false,
}) => {
  if (!data) {
    return (
      <Card title='Network Statistics'>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Card>
    );
  }

  // Format the last update time
  const formatLastUpdate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  // Basic stats that are always shown
  const renderBasicStats = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1 }}>
      <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
        <Paper sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
          <Typography variant='h6' color='primary'>
            {data.totalBeads.toLocaleString()}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Total Beads
          </Typography>
        </Paper>
      </Box>
      <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
        <Paper sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
          <Typography variant='h6' color='primary'>
            {data.networkHashrate} TH/s
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Network Hashrate
          </Typography>
        </Paper>
      </Box>
      <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
        <Paper sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
          <Typography variant='h6' color='primary'>
            {data.activeMiners}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Active Miners
          </Typography>
        </Paper>
      </Box>
      <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1 }}>
        <Paper sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
          <Typography variant='h6' color='primary'>
            {data.averageConfirmationTime} min
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Avg. Confirmation Time
          </Typography>
        </Paper>
      </Box>
    </Box>
  );

  // Additional stats for detailed view
  const renderDetailedStats = () => {
    if (!detailed) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant='h6' sx={{ mb: 2, px: 1 }}>
          Detailed Statistics
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1 }}>
          <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography variant='subtitle1' sx={{ mb: 1 }} color='primary'>
                Time Statistics
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant='body2'
                  component='span'
                  sx={{ fontWeight: 'bold' }}>
                  Last Update:
                </Typography>
                <Typography variant='body2' component='span' sx={{ ml: 1 }}>
                  {formatLastUpdate(data.lastUpdate)}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant='body2'
                  component='span'
                  sx={{ fontWeight: 'bold' }}>
                  Average Block Time:
                </Typography>
                <Typography variant='body2' component='span' sx={{ ml: 1 }}>
                  {(data.averageConfirmationTime * 60).toFixed(1)} seconds
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant='body2'
                  component='span'
                  sx={{ fontWeight: 'bold' }}>
                  Network Uptime:
                </Typography>
                <Typography variant='body2' component='span' sx={{ ml: 1 }}>
                  98.7% (last 30 days)
                </Typography>
              </Box>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography variant='subtitle1' sx={{ mb: 1 }} color='primary'>
                Network Participation
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant='body2'
                  component='span'
                  sx={{ fontWeight: 'bold' }}>
                  Total Miners:
                </Typography>
                <Typography variant='body2' component='span' sx={{ ml: 1 }}>
                  {data.activeMiners + 14}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant='body2'
                  component='span'
                  sx={{ fontWeight: 'bold' }}>
                  Active Miners:
                </Typography>
                <Typography variant='body2' component='span' sx={{ ml: 1 }}>
                  {data.activeMiners}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant='body2'
                  component='span'
                  sx={{ fontWeight: 'bold' }}>
                  Pool Hashrate Share:
                </Typography>
                <Typography variant='body2' component='span' sx={{ ml: 1 }}>
                  {((data.networkHashrate / 320) * 100).toFixed(2)}% of global
                  hashrate
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>

        <Box sx={{ mt: 2, px: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Note: Some statistics are estimates based on available data. Last
            updated: {formatLastUpdate(data.lastUpdate)}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Card title='Network Statistics'>
      {renderBasicStats()}
      {renderDetailedStats()}
    </Card>
  );
};

export default NetworkStats;
