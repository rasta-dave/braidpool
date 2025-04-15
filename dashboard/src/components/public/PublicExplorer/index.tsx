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
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Card from '../../common/Card';
import BraidVisualization from '../../BraidVisualization';
import { PublicApiClient } from '../../../api/public/client';
import NetworkStats from './NetworkStats';
import BeadExplorer from './BeadExplorer';
import RecentBeadsTable from './RecentBeadsTable';
import { testPublicApi, displayTestResults } from '../../../utils/apiTestUtils';
import { PUBLIC_API_URL } from '../../../config/api';
import ApiStatusIndicator from './ApiStatusIndicator';
import useSimulatorData from '../../../hooks/useSimulatorData';
import SimulatorConnection from '../../SimulatorConnection';

// Initialize API client
const publicApiClient = new PublicApiClient();

// Define available tabs as an enum
enum ExplorerTab {
  OVERVIEW = 'overview',
  BRAID = 'braid',
  BEADS = 'beads',
  STATS = 'stats',
  ABOUT = 'about',
  DEBUG = 'debug', // Add debug tab
}

const PublicExplorer: React.FC = () => {
  // Use our new simulator data hook
  const {
    braidData,
    visualizationData,
    isLoading,
    error: dataError,
    refresh,
  } = useSimulatorData();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkStats, setNetworkStats] = useState<any>({
    totalBeads: 0,
    lastUpdate: new Date().toISOString(),
    networkHashrate: '0 PH/s',
    activeMiners: 0,
    averageConfirmationTime: 0,
  });
  const [currentTab, setCurrentTab] = useState<ExplorerTab>(
    ExplorerTab.OVERVIEW
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // API testing state
  const [apiTestResults, setApiTestResults] = useState<any>(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);

  // Fetch network stats when component mounts
  useEffect(() => {
    const isMounted = { current: true };

    const fetchStats = async () => {
      try {
        console.log('🔄 Loading network statistics...');
        setLoading(true);
        setError(null);

        // Get network stats
        const stats = await publicApiClient.getNetworkStats();

        // Only update state if component is still mounted
        if (isMounted.current) {
          // Map API response to our component's expected format
          const formattedStats = {
            totalBeads: stats?.beadCount ?? 0,
            lastUpdate: stats?.lastUpdated ?? new Date().toISOString(),
            networkHashrate: stats?.networkHashrate ?? '0 PH/s',
            activeMiners: stats?.activeMiners ?? 0,
            averageConfirmationTime: Math.round(Math.random() * 10), // Placeholder since this isn't in the API
          };

          setNetworkStats(formattedStats);
          console.log('✅ Network stats loaded successfully!', formattedStats);
        }
      } catch (err: any) {
        console.error('❌ Error loading network stats:', err);
        if (isMounted.current) {
          setError(`Failed to load data: ${err.message || 'Unknown error'}`);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    // Set up polling interval to keep data fresh, but don't poll too frequently
    const intervalId = setInterval(fetchStats, 120000); // Update every 2 minutes

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
    };
  }, []);

  // Update error state when data error changes
  useEffect(() => {
    if (dataError) {
      setError(dataError.message);
    }
  }, [dataError]);

  // Handle tab change
  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: ExplorerTab
  ) => {
    setCurrentTab(newValue);
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      console.log(`🔍 Searching for: ${searchQuery}`);
      setLoading(true);
      setError(null);

      const results = await publicApiClient.searchBeads(searchQuery);
      setSearchResults(results);
      console.log(`✅ Found ${results.length} results for "${searchQuery}"`);

      // Switch to beads tab
      setCurrentTab(ExplorerTab.BEADS);
    } catch (err: any) {
      console.error(`❌ Error searching for "${searchQuery}":`, err);
      setError(`Search failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle key press in search field
  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle API tests
  const handleRunApiTests = async () => {
    setApiTestLoading(true);
    try {
      const results = await testPublicApi();
      setApiTestResults(results);
    } catch (err) {
      console.error('❌ Error running API tests:', err);
    } finally {
      setApiTestLoading(false);
    }
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
                  {visualizationData ? (
                    <Box>
                      <BraidVisualization
                        data={visualizationData}
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
                  ) : isLoading ? (
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
              {visualizationData ? (
                <Box>
                  <BraidVisualization
                    data={visualizationData}
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
              ) : isLoading ? (
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
            <Card title='About the Braidpool Explorer'>
              <Box>
                <Typography variant='h6' gutterBottom>
                  What is Braidpool?
                </Typography>
                <Typography variant='body1' paragraph>
                  Braidpool is a decentralized mining pool for Bitcoin,
                  implemented as a short-lived DAG-based layer-1 blockchain. It
                  enables miners to build their own blocks while maintaining low
                  variance and efficient payouts.
                </Typography>

                <Typography variant='h6' gutterBottom>
                  About This Explorer
                </Typography>
                <Typography variant='body1' paragraph>
                  This public explorer provides real-time insights into the
                  Braidpool network, allowing anyone to:
                </Typography>
                <ul>
                  <li>
                    <Typography variant='body1'>
                      View the Directed Acyclic Graph (DAG) structure of the
                      braid
                    </Typography>
                  </li>
                  <li>
                    <Typography variant='body1'>
                      Explore individual beads (shares) and their properties
                    </Typography>
                  </li>
                  <li>
                    <Typography variant='body1'>
                      Monitor network statistics and performance
                    </Typography>
                  </li>
                  <li>
                    <Typography variant='body1'>
                      Search for specific beads by hash or miner
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

      case ExplorerTab.DEBUG:
        return (
          <Box sx={{ mt: 2 }}>
            <Card title='Simulator Connection'>
              <SimulatorConnection />
            </Card>

            <Box sx={{ mt: 3 }}>
              <Card title='API Connection Status'>
                <ApiStatusIndicator />
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={refresh}
                    startIcon={
                      isLoading ? (
                        <CircularProgress size={20} color='inherit' />
                      ) : null
                    }
                    disabled={isLoading}>
                    {isLoading ? 'Refreshing...' : 'Refresh Data'}
                  </Button>
                </Box>
              </Card>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Card title='API Debugging Tools'>
                <Box sx={{ mb: 3 }}>
                  <Typography variant='h6' gutterBottom>
                    Public API Detailed Test
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 2 }}>
                    Run detailed API tests with the endpoint:{' '}
                    <code>{PUBLIC_API_URL}</code>
                  </Typography>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleRunApiTests}
                    disabled={apiTestLoading}
                    startIcon={
                      apiTestLoading ? (
                        <CircularProgress size={20} color='inherit' />
                      ) : null
                    }>
                    {apiTestLoading ? 'Running Tests...' : 'Run API Tests'}
                  </Button>
                </Box>

                {apiTestResults && (
                  <Box>
                    <Typography variant='h6' gutterBottom>
                      Test Results
                    </Typography>
                    {Object.entries(apiTestResults.tests).map(
                      ([testName, result]: [string, any]) => (
                        <Accordion key={testName} sx={{ mb: 1 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography
                              variant='body1'
                              color={result.success ? 'success.main' : 'error'}>
                              {testName} {result.success ? '✅' : '❌'} (
                              {result.duration}ms)
                            </Typography>
                          </AccordionSummary>

                          <AccordionDetails>
                            {result.success ? (
                              <Box>
                                <Typography variant='body2' gutterBottom>
                                  Response Data:
                                </Typography>
                                <Box
                                  component='pre'
                                  sx={{
                                    bgcolor: 'background.paper',
                                    p: 1,
                                    borderRadius: 1,
                                    overflowX: 'auto',
                                    fontSize: '0.75rem',
                                  }}>
                                  {JSON.stringify(result.data, null, 2)}
                                </Box>
                              </Box>
                            ) : (
                              <Box>
                                <Typography variant='body2' color='error'>
                                  Error: {result.error}
                                </Typography>
                              </Box>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      )
                    )}

                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                      }}>
                      <Typography variant='body1'>
                        Summary:{' '}
                        {
                          Object.values(apiTestResults.tests).filter(
                            (r: any) => r.success
                          ).length
                        }
                        /{Object.keys(apiTestResults.tests).length} endpoints
                        successful
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Card>
            </Box>
          </Box>
        );

      default:
        return <Typography>Selected tab content not available</Typography>;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' gutterBottom>
          Braidpool Public Explorer
        </Typography>
        <Typography variant='body1' gutterBottom color='text.secondary'>
          Explore the Braidpool network structure, beads (shares), and
          statistics
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder='Search by bead hash or miner address'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleSearchKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon />
              </InputAdornment>
            ),
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

      {/* Error Display */}
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'
          aria-label='explorer tabs'>
          <Tab label='Overview' value={ExplorerTab.OVERVIEW} />
          <Tab label='Braid Visualization' value={ExplorerTab.BRAID} />
          <Tab label='Beads' value={ExplorerTab.BEADS} />
          <Tab label='Network Stats' value={ExplorerTab.STATS} />
          <Tab label='About' value={ExplorerTab.ABOUT} />
          <Tab label='Debug' value={ExplorerTab.DEBUG} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {renderTabContent()}
    </Box>
  );
};

export default PublicExplorer;
