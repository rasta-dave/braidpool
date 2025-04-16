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
  Chip,
  Button,
  Switch,
  FormControlLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Card from '../../common/Card';
import { BraidVisualization } from '../../visualization';
import { transformBraidData } from '../../../utils/braidDataTransformer';
import {
  normalizeVisualizationData,
  normalizeRawBraidData,
} from '../../../utils/dataNormalizer';
import NetworkStats from './NetworkStats';
import BeadExplorer from './BeadExplorer';
import RecentBeadsTable from './RecentBeadsTable';
import {
  BraidVisualizationData,
  BraidNode,
  BraidLink,
} from '../../../types/braid';
import SimpleBraidView from './SimpleBraidView';
import publicApiClient from '../../../api/public/client';

// Define available tabs as an enum
enum ExplorerTab {
  OVERVIEW = 'overview',
  BRAID = 'braid',
  BEADS = 'beads',
  STATS = 'stats',
  ABOUT = 'about',
}

// Create a wrapper component for BraidVisualization that handles type conversions
const BraidVisWrapper: React.FC<{
  data: BraidVisualizationData | null;
  width?: number;
  height?: number;
}> = ({ data, width, height }) => {
  // If no data, pass null directly
  if (!data)
    return <BraidVisualization data={null} width={width} height={height} />;

  // Use the normalizeVisualizationData function to ensure consistent data types
  const normalizedData = normalizeVisualizationData(data);

  return (
    <BraidVisualization data={normalizedData} width={width} height={height} />
  );
};

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
  const [useSimpleView, setUseSimpleView] = useState(false);

  // Fetch data when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Define fetchData as separate function for reuse
  const fetchData = async () => {
    try {
      console.log('🔄 Loading blockchain explorer data...');
      setLoading(true);
      setError(null);

      // Get braid data from the /test_data endpoint
      console.log('🔄 Calling publicApiClient.getBraidData()...');
      const rawData = await publicApiClient.getBraidData();

      // Normalize the raw data to ensure consistent types
      const data = normalizeRawBraidData(rawData);

      // Validate that the data meets our requirements
      if (!data) {
        console.error('❌ API returned null or undefined data');
        throw new Error('API returned empty data');
      }

      if (!data.parents || !data.children) {
        console.error('❌ API data missing required properties', data);
        throw new Error(
          'API data missing required parents/children properties'
        );
      }

      console.log('📊 Raw data from API:', {
        // Log relevant properties of the data structure
        beadCount: data.bead_count || Object.keys(data.parents).length,
        parentCount: Object.keys(data.parents).length,
        childrenCount: Object.keys(data.children).length,
        cohortCount: data.cohorts?.length || 'missing',
        highestWorkPathLength: data.highest_work_path?.length || 'N/A',
        tipCount: data.tips?.length || 'calculating...',
      });

      // Transform data for visualization
      console.log('🔄 Transforming data with transformBraidData...');
      const transformedData = transformBraidData(data);

      if (!transformedData) {
        console.error('❌ Data transformation failed, returned null');
        throw new Error('Failed to transform data - check console for details');
      }

      console.log('📊 Transformed data ready for visualization:', {
        nodes: transformedData?.nodes?.length || 0,
        links: transformedData?.links?.length || 0,
        cohorts: transformedData?.cohorts?.length || 0,
        firstCohort: transformedData?.cohorts?.[0]?.length || 'N/A',
        sampleNodes: transformedData?.nodes?.slice(0, 3).map((n) => n.id) || [],
      });

      setBraidData(transformedData);

      // Get network stats
      try {
        const stats = await publicApiClient.getNetworkStats();
        setNetworkStats(stats);
      } catch (statsError: any) {
        console.warn('⚠️ Could not load network stats:', statsError.message);
        // Continue even if stats fails - not critical
      }

      console.log('✅ Explorer data loaded successfully!');
    } catch (error: any) {
      console.error('❌ Error loading explorer data:', error);
      setError(`Failed to load data: ${error.message}`);
      setBraidData(null);
    } finally {
      setLoading(false);
    }
  };

  // Render visualization component based on user preference
  const renderVisualization = (width?: number, height?: number) => {
    if (!braidData) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    return useSimpleView ? (
      <SimpleBraidView data={braidData} />
    ) : (
      <BraidVisWrapper data={braidData} width={width} height={height} />
    );
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const results = await publicApiClient.searchBeads(searchQuery.trim());
      setSearchResults(results);
      setCurrentTab(ExplorerTab.BEADS);
    } catch (error: any) {
      console.error('❌ Search error:', error);
      setError(`Search failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: ExplorerTab
  ) => {
    setCurrentTab(newValue);
  };

  // Toggle between visualization modes
  const handleToggleView = () => {
    setUseSimpleView(!useSimpleView);
  };

  // Render current tab content
  const renderTabContent = () => {
    switch (currentTab) {
      case ExplorerTab.OVERVIEW:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* API Status Indicator */}
              <Grid sx={{ width: '100%', mb: 2 }}>
                <Card title='API Status'>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2 }}>
                    <Chip
                      label={`Using ${
                        braidData?.nodes?.length || 0
                      } nodes from /test_data`}
                      color='success'
                      variant='outlined'
                    />
                    <Chip
                      label={`${braidData?.links?.length || 0} connections`}
                      color='primary'
                      variant='outlined'
                    />
                    <Chip
                      label={`${braidData?.cohorts?.length || 0} cohorts`}
                      color='secondary'
                      variant='outlined'
                    />
                  </Box>
                </Card>
              </Grid>

              {/* Network Stats */}
              <Grid sx={{ width: { xs: '100%', md: '33.333%' } }}>
                <NetworkStats data={networkStats} />
              </Grid>

              {/* Braid Visualization with view toggle */}
              <Grid sx={{ width: { xs: '100%', md: '66.667%' } }}>
                <Card
                  title='Braid Visualization'
                  headerExtra={
                    <FormControlLabel
                      control={
                        <Switch
                          checked={useSimpleView}
                          onChange={handleToggleView}
                          size='small'
                        />
                      }
                      label={useSimpleView ? 'Simple View' : 'Graph View'}
                      sx={{ mr: 1 }}
                    />
                  }>
                  {loading ? (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : error ? (
                    <Alert severity='error' sx={{ m: 2 }}>
                      {error}
                    </Alert>
                  ) : (
                    <Box>
                      {renderVisualization(700, 400)}
                      <Typography
                        variant='body2'
                        sx={{
                          mt: 1,
                          fontSize: '0.85rem',
                          color: 'text.secondary',
                        }}>
                        The Braidpool DAG structure showing parent-child
                        relationships between beads.{' '}
                        {!useSimpleView && 'Hover over nodes to see details.'}
                      </Typography>
                    </Box>
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
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useSimpleView}
                    onChange={handleToggleView}
                    size='small'
                  />
                }
                label={useSimpleView ? 'Simple View' : 'Graph View'}
              />
            </Box>
            <Card title='Braid Visualization (Full View)'>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity='error' sx={{ m: 2 }}>
                  {error}
                </Alert>
              ) : (
                <Box>
                  {renderVisualization(1200, 800)}
                  <Typography
                    variant='body2'
                    sx={{ mt: 1, p: 1, bgcolor: 'background.paper' }}>
                    The Braidpool structure shows all mined shares and their
                    relationships.{' '}
                    {!useSimpleView && 'Hover over nodes to see more details.'}
                  </Typography>
                </Box>
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
        return <Typography>Unknown tab</Typography>;
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
        <Alert
          severity='error'
          sx={{ mb: 3 }}
          action={
            <Button color='inherit' size='small' onClick={() => fetchData()}>
              Retry
            </Button>
          }>
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
