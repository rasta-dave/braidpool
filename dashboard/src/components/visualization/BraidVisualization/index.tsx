import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { BraidVisualizationData, BraidNode } from '../../../types/braid';
import { createDagLayout } from '../../../utils/braidLayoutCalculator';
import Controls from './Controls';
import Renderer from './Renderer';
import Stats from './Stats';
import Minimap from './Minimap';

interface BraidVisualizationProps {
  data: BraidVisualizationData | null;
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
}

/**
 * BraidVisualization component for rendering the DAG structure
 * This modular version replaces the previous monolithic BraidVisualizationOptimized
 */
const BraidVisualization: React.FC<BraidVisualizationProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick,
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // State for visualization
  const [svgWidth, setSvgWidth] = useState(width);
  const [windowStart, setWindowStart] = useState(0);
  const [windowSize, setWindowSize] = useState(100); // Show 100 cohorts at a time
  const [totalCohorts, setTotalCohorts] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [visibleData, setVisibleData] = useState<BraidVisualizationData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [statsVisible, setStatsVisible] = useState(false);
  const [jumpToCohort, setJumpToCohort] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);

  // Layout options
  const [layoutMode, setLayoutMode] = useState<'force' | 'grid' | 'braid'>(
    'braid'
  );
  const [simulationRunning, setSimulationRunning] = useState(false);

  // Node positions from layout algorithm
  const [nodePositions, setNodePositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());

  // Stats
  const [stats, setStats] = useState({
    totalNodes: 0,
    visibleNodes: 0,
    totalCohorts: 0,
    visibleCohorts: 0,
    cohortSizeDistribution: {} as Record<string, number>,
  });

  // Generate distribution chart data
  const distributionData = useMemo(() => {
    if (!stats || !stats.cohortSizeDistribution) return [];

    return Object.entries(stats.cohortSizeDistribution)
      .map(([label, count]) => ({
        label,
        count: count as number,
        percentage: Math.round(((count as number) / stats.totalCohorts) * 100),
      }))
      .sort((a, b) => {
        // Custom sort to maintain logical order of size buckets
        const order = ['1', '2', '3', '4-5', '6-10', '11-20', '20+'];
        return order.indexOf(a.label) - order.indexOf(b.label);
      });
  }, [stats]);

  // Initialization effect - process incoming data
  useEffect(() => {
    try {
      console.log('🔍 BraidVisualization received data:', {
        nodes: data?.nodes?.length || 0,
        links: data?.links?.length || 0,
        cohorts: data?.cohorts?.length || 0,
      });

      if (data?.cohorts) {
        setTotalCohorts(data.cohorts.length);
        setStats((prev) => ({
          ...prev,
          totalNodes: data.nodes.length,
          totalCohorts: data.cohorts.length,
        }));
      }

      // Initialize window to show the most recent cohorts
      if (data?.cohorts?.length && data.cohorts.length > windowSize) {
        setWindowStart(data.cohorts.length - windowSize);
      }

      // Reset render error if data is loaded
      if (data) {
        setRenderError(null);
      }
    } catch (error) {
      console.error('❌ Error processing data:', error);
      setRenderError(
        `Error processing data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }, [data, windowSize]);

  // Update SVG width when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const legendSpace = 0; // We'll handle this differently
        const containerWidth = containerRef.current.clientWidth;
        setSvgWidth(Math.max(300, containerWidth - legendSpace));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Filter data to only include nodes and links within our window
  useEffect(() => {
    if (!data) {
      console.log('⚠️ No data provided to BraidVisualization');
      setVisibleData(null);
      setIsLoading(false);
      return;
    }

    if (!data.nodes?.length) {
      console.log('⚠️ Data has no nodes', data);
      setVisibleData(null);
      setIsLoading(false);
      return;
    }

    if (!data.cohorts?.length) {
      console.log('⚠️ Data has no cohorts', data);
      // Use fallback - all nodes in a single cohort
      if (data.nodes.length > 0) {
        console.log('🔄 Creating fallback cohort with all nodes');
        const fallbackData = {
          ...data,
          cohorts: [data.nodes.map((node) => node.id)],
        };
        setVisibleData(fallbackData);

        // Create fallback positions with a simple grid layout
        const gridSize = Math.ceil(Math.sqrt(data.nodes.length));
        const positions = new Map<string, { x: number; y: number }>();

        data.nodes.forEach((node, index) => {
          const col = index % gridSize;
          const row = Math.floor(index / gridSize);
          positions.set(node.id, {
            x: col * (svgWidth / gridSize) + svgWidth / gridSize / 2,
            y: row * (height / gridSize) + height / gridSize / 2,
          });
        });

        setNodePositions(positions);
      } else {
        setVisibleData(null);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log(
      `🔄 Filtering data for window: ${windowStart} to ${
        windowStart + windowSize
      } (total cohorts: ${data.cohorts.length})`
    );

    try {
      // Adjust window if needed
      const adjustedWindowStart = Math.min(
        windowStart,
        Math.max(0, data.cohorts.length - 1)
      );
      if (adjustedWindowStart !== windowStart) {
        console.log(
          `🔄 Adjusting window start from ${windowStart} to ${adjustedWindowStart}`
        );
        setWindowStart(adjustedWindowStart);
        return; // Will trigger this effect again with correct window
      }

      // Create a map for quick lookups
      const nodeMap = new Map<string, BraidNode>();
      data.nodes.forEach((node) => nodeMap.set(node.id, node));

      // Create a window of cohorts
      const windowEnd = Math.min(windowStart + windowSize, data.cohorts.length);
      const visibleCohorts = data.cohorts.slice(windowStart, windowEnd);

      if (visibleCohorts.length === 0) {
        console.warn('⚠️ No cohorts in the current window, using fallback');
        // Use first cohort as fallback
        if (data.cohorts.length > 0) {
          visibleCohorts.push(data.cohorts[0]);
        } else {
          // Last resort fallback - all nodes in a single cohort
          visibleCohorts.push(data.nodes.map((node) => node.id));
        }
      }

      // Create a set of visible node IDs from the cohorts in our window
      const visibleNodeIds = new Set<string>();
      visibleCohorts.forEach((cohort) => {
        cohort.forEach((nodeId) => {
          // Only add if the node actually exists in our nodes array
          if (nodeMap.has(nodeId)) {
            visibleNodeIds.add(nodeId);
          }
        });
      });

      console.log(`📊 Window contains ${visibleNodeIds.size} visible nodes`);

      // If we have no visible nodes, something is wrong with our window or data
      if (visibleNodeIds.size === 0) {
        console.warn(
          '⚠️ No visible nodes in window - adding all nodes as fallback'
        );
        // Add all nodes as fallback
        data.nodes.forEach((node) => visibleNodeIds.add(node.id));

        // Add a fallback cohort with all nodes
        visibleCohorts.push(Array.from(visibleNodeIds));
      }

      // Filter nodes to only include those in visible cohorts
      const filteredNodes = data.nodes.filter((node) =>
        visibleNodeIds.has(node.id)
      );

      // Filter links to only include those between visible nodes
      const filteredLinks = data.links.filter(
        (link) =>
          visibleNodeIds.has(link.source) && visibleNodeIds.has(link.target)
      );

      // Create filtered data object
      const filteredData: BraidVisualizationData = {
        nodes: filteredNodes,
        links: filteredLinks,
        cohorts: visibleCohorts,
      };

      console.log('📊 Filtered data:', {
        nodes: filteredData.nodes.length,
        links: filteredData.links.length,
        cohorts: filteredData.cohorts.length,
      });

      // Update stats
      setStats((prev) => ({
        ...prev,
        visibleNodes: filteredNodes.length,
        visibleCohorts: visibleCohorts.length,
        cohortSizeDistribution: calculateCohortDistribution(data.cohorts),
      }));

      // Apply layout and update node positions
      const positions = createDagLayout(
        filteredData,
        svgWidth,
        height,
        zoomLevel,
        layoutMode
      );

      if (positions.size === 0) {
        console.error(
          '❌ Layout calculation failed - creating fallback positions'
        );

        // Create fallback positions with a grid layout
        const fallbackPositions = new Map<string, { x: number; y: number }>();
        const gridSize = Math.ceil(Math.sqrt(filteredNodes.length));

        filteredNodes.forEach((node, index) => {
          const col = index % gridSize;
          const row = Math.floor(index / gridSize);
          fallbackPositions.set(node.id, {
            x: col * (svgWidth / gridSize) + svgWidth / gridSize / 2,
            y: row * (height / gridSize) + height / gridSize / 2,
          });
        });

        setNodePositions(fallbackPositions);
        console.log(
          `✅ Created fallback grid layout with ${fallbackPositions.size} positions`
        );
      } else {
        setNodePositions(positions);
        console.log(`✅ Layout created with ${positions.size} positions`);
      }

      setVisibleData(filteredData);
      setIsLoading(false);
      setRenderError(null); // Clear any previous errors
    } catch (error) {
      console.error('❌ Error filtering data:', error);
      setRenderError(
        `Error filtering data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      setIsLoading(false);
    }
  }, [data, windowStart, windowSize, svgWidth, height, zoomLevel, layoutMode]);

  // Calculate cohort size distribution
  const calculateCohortDistribution = (
    cohorts: string[][]
  ): Record<string, number> => {
    const distribution: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4-5': 0,
      '6-10': 0,
      '11-20': 0,
      '20+': 0,
    };

    cohorts.forEach((cohort) => {
      const size = cohort.length;
      if (size === 1) distribution['1']++;
      else if (size === 2) distribution['2']++;
      else if (size === 3) distribution['3']++;
      else if (size >= 4 && size <= 5) distribution['4-5']++;
      else if (size >= 6 && size <= 10) distribution['6-10']++;
      else if (size >= 11 && size <= 20) distribution['11-20']++;
      else distribution['20+']++;
    });

    return distribution;
  };

  // Control handlers
  const handleWindowChange = (newValue: number) => {
    setWindowStart(newValue);
  };

  const handleJumpToFirst = () => {
    setWindowStart(0);
  };

  const handleJumpToLast = () => {
    if (data?.cohorts) {
      setWindowStart(Math.max(0, data.cohorts.length - windowSize));
    }
  };

  const handleJumpBack = () => {
    setWindowStart((prev) => Math.max(0, prev - Math.floor(windowSize / 2)));
  };

  const handleJumpForward = () => {
    if (data?.cohorts) {
      setWindowStart((prev) =>
        Math.min(
          data.cohorts.length - windowSize,
          prev + Math.floor(windowSize / 2)
        )
      );
    }
  };

  const handleJumpToCohort = () => {
    if (!jumpToCohort || !data?.cohorts) return;

    const cohortIndex = parseInt(jumpToCohort, 10);
    if (
      isNaN(cohortIndex) ||
      cohortIndex < 0 ||
      cohortIndex >= data.cohorts.length
    ) {
      console.warn(`⚠️ Invalid cohort index: ${jumpToCohort}`);
      return;
    }

    // Calculate a window position that includes the requested cohort
    const windowPosition = Math.max(
      0,
      Math.min(cohortIndex, data.cohorts.length - windowSize)
    );
    setWindowStart(windowPosition);
  };

  const handleWindowSizeChange = (newValue: number) => {
    setWindowSize(newValue);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(5, prev + 0.2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.5, prev - 0.2));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleLayoutModeChange = (mode: 'force' | 'grid' | 'braid') => {
    setLayoutMode(mode);
  };

  const handleToggleSimulation = () => {
    setSimulationRunning((prev) => !prev);
  };

  const handleToggleStats = () => {
    setStatsVisible((prev) => !prev);
  };

  // Render
  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%' }}>
      {renderError && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {renderError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Paper
            elevation={3}
            sx={{
              height: height,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2,
            }}>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Typography variant='h6'>Braid Visualization</Typography>
              <Typography variant='body2' color='text.secondary'>
                {stats.visibleNodes > 0
                  ? `Showing ${stats.visibleNodes} nodes in ${stats.visibleCohorts} cohorts`
                  : 'No data'}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, position: 'relative' }}>
              <Renderer
                data={visibleData}
                width={svgWidth}
                height={height - 170} // Adjust for header and controls
                zoomLevel={zoomLevel}
                layoutMode={layoutMode}
                simulationRunning={simulationRunning}
                nodePositions={nodePositions}
                onNodeClick={onNodeClick}
                isLoading={isLoading}
              />

              {statsVisible && (
                <Stats stats={stats} distributionData={distributionData} />
              )}

              {/* Minimap in bottom right */}
              <Box
                sx={{ position: 'absolute', bottom: 10, right: 10, zIndex: 5 }}>
                <Minimap
                  data={data}
                  width={200}
                  height={40}
                  windowStart={windowStart}
                  windowSize={windowSize}
                  totalCohorts={totalCohorts}
                />
              </Box>
            </Box>

            <Controls
              totalCohorts={totalCohorts}
              windowStart={windowStart}
              windowSize={windowSize}
              zoomLevel={zoomLevel}
              layoutMode={layoutMode}
              simulationRunning={simulationRunning}
              jumpToCohort={jumpToCohort}
              onWindowChange={handleWindowChange}
              onWindowSizeChange={handleWindowSizeChange}
              onJumpToFirst={handleJumpToFirst}
              onJumpToLast={handleJumpToLast}
              onJumpBack={handleJumpBack}
              onJumpForward={handleJumpForward}
              onJumpToCohort={handleJumpToCohort}
              onJumpToCohortChange={setJumpToCohort}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
              onLayoutModeChange={handleLayoutModeChange}
              onToggleSimulation={handleToggleSimulation}
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default BraidVisualization;
