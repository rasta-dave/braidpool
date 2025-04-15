import React, { useState, useEffect } from 'react';
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import colors from '../theme/colors';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import ConstructionIcon from '@mui/icons-material/Construction';
import InventoryIcon from '@mui/icons-material/Inventory';
import MemoryIcon from '@mui/icons-material/Memory';
import LayersIcon from '@mui/icons-material/Layers';

// Components
import BraidVisualization from './BraidVisualization';
import BraidVisualizationOptimized from './BraidVisualizationOptimized';
import BraidCohortStats from './BraidCohortStats';
import TopStatsBar from './TopStatsBar';
import Card from './common/Card';
import Header from './Header';
import InstallationInstructions from './InstallationInstructions';
import MineInventoryDashboard from './MineInventoryDashboard';
import PoolHashrateChart from './PoolHashrateChart';
import MempoolLatencyStats from './MempoolLatencyStats';
import RecentBlocksTable from './RecentBlocksTable';
import PublicExplorer from './public/PublicExplorer';

// Utils
import {
  loadSampleBraidData,
  transformBraidData,
} from '../utils/braidDataTransformer';

// Hooks
import useSimulatorData from '../hooks/useSimulatorData';

// Constants
const drawerWidth = 240;

// Define available pages as an enum
enum Page {
  INSTALLATION = 'installation',
  DASHBOARD = 'dashboard',
  MINING_INVENTORY = 'mining-inventory',
  MEMPOOL = 'mempool',
  DAG_VISUALIZATION = 'dag-visualization',
  DAG_VISUALIZATION_OPTIMIZED = 'dag-visualization-optimized',
  COHORT_STATS = 'cohort-stats',
  PUBLIC_EXPLORER = 'public-explorer',
}

const Dashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [perfStats, setPerfStats] = useState({
    fetchTime: 0,
    transformTime: 0,
    lastUpdate: new Date(),
  });

  // Get simulator data for the full dataset (4999 cohorts)
  const {
    visualizationData: simulatorData,
    isLoading: simulatorLoading,
    error: simulatorError,
  } = useSimulatorData();

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Loading braid data...');
        setLoading(true);
        setError(null);

        // Track performance
        const fetchStart = performance.now();

        // Load sample data
        const braidData = await loadSampleBraidData();

        const fetchEnd = performance.now();
        const fetchTime = fetchEnd - fetchStart;

        const transformStart = performance.now();

        // Transform data for visualization
        const transformedData = transformBraidData(braidData);

        const transformEnd = performance.now();
        const transformTime = transformEnd - transformStart;

        setData(transformedData);
        setPerfStats({
          fetchTime,
          transformTime,
          lastUpdate: new Date(),
        });

        console.log('✅ Data loaded successfully!', {
          fetchTime: `${fetchTime.toFixed(2)}ms`,
          transformTime: `${transformTime.toFixed(2)}ms`,
          totalTime: `${(fetchTime + transformTime).toFixed(2)}ms`,
        });
      } catch (err) {
        console.error('❌ Error loading data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Sidebar drawer content
  const sidebar = (
    <Drawer
      variant='permanent'
      sx={{
        display: { xs: 'none', sm: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: drawerWidth,
          backgroundColor: colors.paper,
          borderRight: `1px solid ${colors.border}`,
        },
      }}
      open>
      <Box sx={{ p: 2 }}>
        <Typography variant='h6' color='primary' sx={{ fontWeight: 700 }}>
          Braidpool
        </Typography>
      </Box>
      <Divider sx={{ borderColor: colors.border }} />
      <List>
        <ListItemButton
          onClick={() => setCurrentPage(Page.INSTALLATION)}
          selected={currentPage === Page.INSTALLATION}
          sx={{
            pl: 2,
            py: 1.5,
            borderLeft:
              currentPage === Page.INSTALLATION
                ? `4px solid ${colors.primary}`
                : 'none',
            '&.Mui-selected': {
              backgroundColor: 'rgba(57, 134, 232, 0.08)',
            },
          }}>
          <ListItemIcon
            sx={{
              minWidth: 40,
              color:
                currentPage === Page.INSTALLATION
                  ? colors.primary
                  : colors.textSecondary,
            }}>
            <ConstructionIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText
            primary='Installation'
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => setCurrentPage(Page.DASHBOARD)}
          selected={currentPage === Page.DASHBOARD}
          sx={{
            pl: 2,
            py: 1.5,
            borderLeft:
              currentPage === Page.DASHBOARD
                ? `4px solid ${colors.primary}`
                : 'none',
            '&.Mui-selected': {
              backgroundColor: 'rgba(57, 134, 232, 0.08)',
            },
          }}>
          <ListItemIcon
            sx={{
              minWidth: 40,
              color:
                currentPage === Page.DASHBOARD
                  ? colors.primary
                  : colors.textSecondary,
            }}>
            <DashboardIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText
            primary='Dashboard'
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => setCurrentPage(Page.MINING_INVENTORY)}
          selected={currentPage === Page.MINING_INVENTORY}
          sx={{
            pl: 2,
            py: 1.5,
            borderLeft:
              currentPage === Page.MINING_INVENTORY
                ? `4px solid ${colors.primary}`
                : 'none',
            '&.Mui-selected': {
              backgroundColor: 'rgba(57, 134, 232, 0.08)',
            },
          }}>
          <ListItemIcon
            sx={{
              minWidth: 40,
              color:
                currentPage === Page.MINING_INVENTORY
                  ? colors.primary
                  : colors.textSecondary,
            }}>
            <InventoryIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText
            primary='Inventory'
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => setCurrentPage(Page.MEMPOOL)}
          selected={currentPage === Page.MEMPOOL}
          sx={{
            pl: 2,
            py: 1.5,
            borderLeft:
              currentPage === Page.MEMPOOL
                ? `4px solid ${colors.primary}`
                : 'none',
            '&.Mui-selected': {
              backgroundColor: 'rgba(57, 134, 232, 0.08)',
            },
          }}>
          <ListItemIcon
            sx={{
              minWidth: 40,
              color:
                currentPage === Page.MEMPOOL
                  ? colors.primary
                  : colors.textSecondary,
            }}>
            <MemoryIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText
            primary='Mempool'
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => setCurrentPage(Page.DAG_VISUALIZATION)}
          selected={currentPage === Page.DAG_VISUALIZATION}
          sx={{
            pl: 2,
            py: 1.5,
            borderLeft:
              currentPage === Page.DAG_VISUALIZATION
                ? `4px solid ${colors.primary}`
                : 'none',
            '&.Mui-selected': {
              backgroundColor: 'rgba(57, 134, 232, 0.08)',
            },
          }}>
          <ListItemIcon
            sx={{
              minWidth: 40,
              color:
                currentPage === Page.DAG_VISUALIZATION
                  ? colors.primary
                  : colors.textSecondary,
            }}>
            <LayersIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText
            primary='DAG Visualization'
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => setCurrentPage(Page.DAG_VISUALIZATION_OPTIMIZED)}
          selected={currentPage === Page.DAG_VISUALIZATION_OPTIMIZED}
          sx={{
            pl: 2,
            py: 1.5,
            borderLeft:
              currentPage === Page.DAG_VISUALIZATION_OPTIMIZED
                ? `4px solid ${colors.primary}`
                : 'none',
            '&.Mui-selected': {
              backgroundColor: 'rgba(57, 134, 232, 0.08)',
            },
          }}>
          <ListItemIcon
            sx={{
              minWidth: 40,
              color:
                currentPage === Page.DAG_VISUALIZATION_OPTIMIZED
                  ? colors.primary
                  : colors.textSecondary,
            }}>
            <LayersIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText
            primary='Optimized DAG'
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => setCurrentPage(Page.COHORT_STATS)}
          selected={currentPage === Page.COHORT_STATS}
          sx={{
            pl: 2,
            py: 1.5,
            borderLeft:
              currentPage === Page.COHORT_STATS
                ? `4px solid ${colors.primary}`
                : 'none',
            '&.Mui-selected': {
              backgroundColor: 'rgba(57, 134, 232, 0.08)',
            },
          }}>
          <ListItemIcon
            sx={{
              minWidth: 40,
              color:
                currentPage === Page.COHORT_STATS
                  ? colors.primary
                  : colors.textSecondary,
            }}>
            <LayersIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText
            primary='Cohort Analysis'
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => setCurrentPage(Page.PUBLIC_EXPLORER)}
          selected={currentPage === Page.PUBLIC_EXPLORER}
          sx={{
            pl: 2,
            py: 1.5,
            borderLeft:
              currentPage === Page.PUBLIC_EXPLORER
                ? `4px solid ${colors.primary}`
                : 'none',
            '&.Mui-selected': {
              backgroundColor: 'rgba(57, 134, 232, 0.08)',
            },
          }}>
          <ListItemIcon
            sx={{
              minWidth: 40,
              color:
                currentPage === Page.PUBLIC_EXPLORER
                  ? colors.primary
                  : colors.textSecondary,
            }}>
            <LayersIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText
            primary='Public Explorer'
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </ListItemButton>
      </List>
    </Drawer>
  );

  // Render the main content based on selected page
  const renderPage = () => {
    switch (currentPage) {
      case Page.INSTALLATION:
        return <InstallationInstructions />;
      case Page.DASHBOARD:
        return (
          <Box sx={{ paddingX: 3, paddingY: 2 }}>
            <TopStatsBar />
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                marginTop: 2,
                gap: 2,
              }}>
              <Card
                title='Pool Hashrate'
                subtitle='Last 24 hours'
                sx={{
                  height: '350px',
                  width: { xs: '100%', md: '100%', lg: '48%' },
                }}>
                <PoolHashrateChart />
              </Card>
              <Card
                title='Recent Blocks'
                subtitle='Last 10 blocks found by pool'
                sx={{
                  height: '350px',
                  width: { xs: '100%', md: '100%', lg: '48%' },
                }}>
                <RecentBlocksTable />
              </Card>
            </Box>
          </Box>
        );
      case Page.MINING_INVENTORY:
        return <MineInventoryDashboard />;
      case Page.MEMPOOL:
        return <MempoolLatencyStats />;
      case Page.DAG_VISUALIZATION:
        return (
          <Box sx={{ p: 3 }}>
            <Card
              title='Directed Acyclic Graph (DAG) Visualization'
              subtitle='Visual representation of the braid structure'
              sx={{ p: 2 }}>
              {loading ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 600,
                  }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity='error'>{error}</Alert>
              ) : data ? (
                <BraidVisualization data={data} height={600} />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 600,
                    color: colors.textPrimary,
                  }}>
                  <Typography>No data available</Typography>
                </Box>
              )}
            </Card>
          </Box>
        );
      case Page.DAG_VISUALIZATION_OPTIMIZED:
        console.log('🔍 Rendering DAG_VISUALIZATION_OPTIMIZED', {
          simulatorDataAvailable: !!simulatorData,
          simulatorLoading,
          simulatorError,
          simulatorNodes: simulatorData?.nodes?.length,
          simulatorLinks: simulatorData?.links?.length,
          simulatorCohorts: simulatorData?.cohorts?.length,
        });
        return (
          <Box sx={{ p: 3 }}>
            <Card
              title='Optimized DAG Visualization'
              subtitle='Enhanced visualization with window and zoom controls'
              sx={{ p: 2 }}>
              {simulatorLoading ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 600,
                  }}>
                  <CircularProgress />
                </Box>
              ) : simulatorError ? (
                <Alert severity='error'>{simulatorError.message}</Alert>
              ) : simulatorData ? (
                <BraidVisualizationOptimized
                  data={simulatorData}
                  height={600}
                />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 600,
                    color: colors.textPrimary,
                  }}>
                  <Typography>No data available</Typography>
                </Box>
              )}
            </Card>
          </Box>
        );
      case Page.COHORT_STATS:
        return (
          <Box sx={{ p: 3 }}>
            <Card
              title='Cohort Analysis Dashboard'
              subtitle='Detailed analysis of braid cohort structure'
              sx={{ p: 2 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity='error'>{error}</Alert>
              ) : (
                <>
                  <BraidCohortStats
                    data={data}
                    loading={loading}
                    error={error}
                  />

                  {!loading && !error && perfStats.lastUpdate && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        backgroundColor: colors.paper,
                        borderRadius: 1,
                      }}>
                      <Typography
                        variant='subtitle2'
                        sx={{ mb: 1, color: colors.textSecondary }}>
                        Performance Metrics
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography
                            variant='caption'
                            sx={{ color: colors.textSecondary }}>
                            Last Refresh:
                          </Typography>
                          <Typography
                            variant='body2'
                            sx={{ color: colors.textPrimary }}>
                            {perfStats.lastUpdate.toLocaleTimeString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography
                            variant='caption'
                            sx={{ color: colors.textSecondary }}>
                            Fetch Time:
                          </Typography>
                          <Typography
                            variant='body2'
                            sx={{ color: colors.textPrimary }}>
                            {perfStats.fetchTime.toFixed(2)}ms
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography
                            variant='caption'
                            sx={{ color: colors.textSecondary }}>
                            Transform Time:
                          </Typography>
                          <Typography
                            variant='body2'
                            sx={{ color: colors.textPrimary }}>
                            {perfStats.transformTime.toFixed(2)}ms
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </>
              )}
            </Card>
          </Box>
        );
      case Page.PUBLIC_EXPLORER:
<<<<<<< HEAD
        return <PublicExplorer />;
      case Page.SIMULATOR:
        return <SimulatorConnection />;
=======
        return (
          <Box sx={{ p: 1 }}>
            <PublicExplorer />
          </Box>
        );
>>>>>>> parent of 0ae49ce (feat: enhance Public API client and dashboard functionality)
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header title='Braidpool' />
      {sidebar}
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          mt: '50px', // Adjust for header height
        }}>
        {renderPage()}
      </Box>
    </Box>
  );
};

export default Dashboard;
