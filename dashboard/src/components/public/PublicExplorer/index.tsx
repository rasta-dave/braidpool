import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Card from '../../common/Card';
import BraidVisualization from '../../BraidVisualization';
import publicApiClient from '../../../api/public/client';
import { transformBraidData } from '../../../utils/braidDataTransformer';
import NetworkStats from './NetworkStats';
import BeadExplorer from './BeadExplorer';
import RecentBeadsTable from './RecentBeadsTable';

// Define available tabs as an enum
enum ExplorerTab {
  OVERVIEW = 'overview',
  BRAID = 'braid',
  BEADS = 'beads',
  STATS = 'stats',
  ABOUT = 'about',
}

const PublicExplorer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [braidData, setBraidData] = useState<any>(null);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<ExplorerTab>(
    ExplorerTab.OVERVIEW
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Loading blockchain explorer data...');
        setLoading(true);
        setError(null);

        // Get braid data
        const data = await publicApiClient.getBraidData();
        const transformedData = transformBraidData(data);
        setBraidData(transformedData);

        // Get network stats
        const stats = await publicApiClient.getNetworkStats();
        setNetworkStats(stats);

        console.log('✅ Explorer data loaded successfully!');
      } catch (err: any) {
        console.error('❌ Error loading explorer data:', err);
        setError(`Failed to load data: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling interval to keep data fresh
    const intervalId = setInterval(fetchData, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      console.log(`🔍 Searching for: ${searchQuery}`);
      setLoading(true);

      const results = await publicApiClient.searchBeads(searchQuery);
      setSearchResults(results);

      // If we have results, switch to the Beads tab
      if (results.length > 0) {
        setCurrentTab(ExplorerTab.BEADS);
      }
    } catch (err: any) {
      console.error('❌ Search error:', err);
      setError(`Search failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: ExplorerTab) => {
    setCurrentTab(newValue);
  };

  // Render current tab content
  const renderTabContent = () => {
    switch (currentTab) {
      case ExplorerTab.OVERVIEW:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Network Stats */}
              <Grid sx={{ width: { xs: '100%', md: '33.333%' } }}>
                <NetworkStats data={networkStats} />
              </Grid>

              {/* Braid Visualization */}
              <Grid sx={{ width: { xs: '100%', md: '66.667%' } }}>
                <Card title='Braid Visualization'>
                  {braidData ? (
                    <Box>
                      <BraidVisualization
                        data={braidData}
                        width={700}
                        height={400}
                      />
                      <Typography
                        variant='body2'
                        sx={{
                          mt: 1,
                          fontSize: '0.85rem',
                          color: 'text.secondary',
                        }}>
                        The Braidpool DAG structure showing parent-child
                        relationships between beads. Hover over nodes to see
                        details.
                      </Typography>
                    </Box>
                  ) : loading ? (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Typography>No data available</Typography>
                  )}
                </Card>
              </Grid>

              {/* Recent Beads Table */}
              <Grid sx={{ width: '100%' }}>
                <RecentBeadsTable limit={10} />
              </Grid>
            </Grid>
          </Box>
        );

      case ExplorerTab.BRAID:
        return (
          <Box sx={{ mt: 2 }}>
            <Card title='Braid Visualization (Full View)'>
              {braidData ? (
                <Box>
                  <BraidVisualization
                    data={braidData}
                    width={1200}
                    height={800}
                  />
                  <Typography
                    variant='body2'
                    sx={{ mt: 1, p: 1, bgcolor: 'background.paper' }}>
                    The Braidpool structure shows all mined shares and their
                    relationships. Hover over nodes to see more details.
                  </Typography>
                </Box>
              ) : loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Typography>No data available</Typography>
              )}
            </Card>
          </Box>
        );

      case ExplorerTab.BEADS:
        return (
          <Box sx={{ mt: 2 }}>
            <BeadExplorer
              searchResults={searchResults}
              searchQuery={searchQuery}
              loading={loading}
              error={error}
            />
          </Box>
        );

      case ExplorerTab.STATS:
        return (
          <Box sx={{ mt: 2 }}>
            <NetworkStats data={networkStats} detailed />
            <Box sx={{ mt: 3 }}>
              <RecentBeadsTable limit={25} />
            </Box>
          </Box>
        );

      case ExplorerTab.ABOUT:
        return (
          <Box sx={{ mt: 2 }}>
            <Card title='About Braidpool'>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant='body1' paragraph>
                  Braidpool is a next-generation mining pool that uses a DAG
                  (Directed Acyclic Graph) structure called a "braid" to track
                  mined shares, offering improved efficiency and fairness.
                </Typography>
                <Typography variant='body1' paragraph>
                  Unlike traditional mining pools, Braidpool allows miners to
                  work on their own block templates, reducing centralization and
                  improving network health.
                </Typography>
                <Typography variant='body1' paragraph>
                  <strong>Key Innovations:</strong>
                </Typography>
                <ul>
                  <li>
                    <Typography variant='body1'>
                      <strong>DAG Structure:</strong> Instead of a linear
                      blockchain, Braidpool uses a DAG where each bead can have
                      multiple parents
                    </Typography>
                  </li>
                  <li>
                    <Typography variant='body1'>
                      <strong>Cohort Formation:</strong> Beads naturally form
                      cohorts as new beads reference multiple parents
                    </Typography>
                  </li>
                  <li>
                    <Typography variant='body1'>
                      <strong>Decentralized Transaction Selection:</strong>{' '}
                      Miners choose their own transactions, reducing censorship
                      risk
                    </Typography>
                  </li>
                </ul>
                <Typography variant='body1'>
                  This public explorer allows anyone to view the Braidpool
                  network structure and statistics, providing transparency and
                  educational value.
                </Typography>
              </Box>
            </Card>
          </Box>
        );

      default:
        return <Typography>Tab content coming soon</Typography>;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant='h4'
        component='h1'
        sx={{ mb: 3, fontWeight: 'bold' }}>
        Braidpool Public Explorer
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant='outlined'
            placeholder='Search by bead hash...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton onClick={handleSearch} edge='end'>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor='primary'
          textColor='primary'
          variant='fullWidth'>
          <Tab label='Overview' value={ExplorerTab.OVERVIEW} />
          <Tab label='Braid Visualization' value={ExplorerTab.BRAID} />
          <Tab label='Bead Explorer' value={ExplorerTab.BEADS} />
          <Tab label='Network Stats' value={ExplorerTab.STATS} />
          <Tab label='About' value={ExplorerTab.ABOUT} />
        </Tabs>
      </Paper>

      {/* Tab content */}
      {renderTabContent()}
    </Box>
  );
};

export default PublicExplorer;
