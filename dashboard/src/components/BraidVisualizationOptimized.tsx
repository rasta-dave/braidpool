import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import * as d3 from 'd3';
import { BraidVisualizationData } from '../types/braid';
import {
  Box,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  Paper,
  Slider,
  Tooltip,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import colors from '../theme/colors';
import { ZoomIn, ZoomOut, Home } from '@mui/icons-material';

interface BraidVisualizationOptimizedProps {
  data: BraidVisualizationData | null;
  width?: number;
  height?: number;
}

const BraidVisualizationOptimized: React.FC<
  BraidVisualizationOptimizedProps
> = ({ data, width = 800, height = 600 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const minimapRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isExtraSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [renderError, setRenderError] = useState<string | null>(null);

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

  // Log data received by the component
  useEffect(() => {
    try {
      console.log('🔍 BraidVisualizationOptimized received data:', {
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
        const legendSpace = isSmallScreen ? 0 : 160;
        const containerWidth = containerRef.current.clientWidth;
        setSvgWidth(Math.max(300, containerWidth - legendSpace));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [isSmallScreen]);

  // Filter data to only include nodes and links within our window
  useEffect(() => {
    if (!data?.nodes?.length || !data?.cohorts?.length) {
      setVisibleData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log(
      `🔄 Filtering data for window: ${windowStart} to ${
        windowStart + windowSize
      }`
    );

    // Create a window of cohorts
    const windowEnd = Math.min(windowStart + windowSize, data.cohorts.length);
    const visibleCohorts = data.cohorts.slice(windowStart, windowEnd);

    // Create Set of nodes in visible cohorts for quick lookup
    const visibleCohortNodes = new Set<number>();
    visibleCohorts.forEach((cohort) => {
      cohort.forEach((nodeId) => {
        visibleCohortNodes.add(nodeId);
      });
    });

    // Filter nodes to only those in visible cohorts
    const nodes = data.nodes.filter((node) => visibleCohortNodes.has(node.id));

    // Filter links to only those where both source and target are visible
    const links = data.links.filter(
      (link) =>
        visibleCohortNodes.has(link.source) &&
        visibleCohortNodes.has(link.target)
    );

    // Update visible data
    setVisibleData({
      nodes,
      links,
      cohorts: visibleCohorts,
    });

    // Update stats
    setStats((prev) => ({
      ...prev,
      visibleNodes: nodes.length,
      visibleCohorts: visibleCohorts.length,
    }));

    setIsLoading(false);

    console.log('📊 Visible data filtered:', {
      nodes: nodes.length,
      links: links.length,
      cohorts: visibleCohorts.length,
    });
  }, [data, windowStart, windowSize]);

  // Color scheme for cohorts - use consistent global index for color
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // Render main visualization
  useEffect(() => {
    if (!svgRef.current || !visibleData?.nodes?.length) {
      return;
    }

    console.log('🔄 Starting visualization rendering...');
    let tooltip: any = null;

    try {
      // Clear previous visualization
      d3.select(svgRef.current).selectAll('*').remove();

      const svg = d3.select(svgRef.current);

      // Create a hierarchical layout for the visible data
      const dagLayout = createDagLayout(
        visibleData,
        svgWidth,
        height,
        zoomLevel
      );

      // Create tooltip
      tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background-color', colors.paper)
        .style('border', `1px solid ${colors.border}`)
        .style('border-radius', '4px')
        .style('padding', '6px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('color', colors.textPrimary);

      // Draw links first (so they're behind nodes)
      svg
        .append('g')
        .selectAll('line')
        .data(visibleData.links)
        .enter()
        .append('line')
        .attr('x1', (d) => dagLayout.get(d.source)?.x || 0)
        .attr('y1', (d) => dagLayout.get(d.source)?.y || 0)
        .attr('x2', (d) => dagLayout.get(d.target)?.x || 0)
        .attr('y2', (d) => dagLayout.get(d.target)?.y || 0)
        .attr('stroke', (d) =>
          d.isHighWorkPath ? colors.tipNode : colors.linkColor
        )
        .attr('stroke-width', (d) => (d.isHighWorkPath ? 2.5 : 1))
        .attr('stroke-opacity', 0.6)
        .attr('marker-end', 'url(#arrow)');

      // Add arrow marker for the links
      svg
        .append('defs')
        .append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', colors.linkColor);

      // Draw the nodes
      svg
        .append('g')
        .selectAll('circle')
        .data(visibleData.nodes)
        .enter()
        .append('circle')
        .attr('r', (d) => (d.isTip ? 10 : 8))
        .attr('cx', (d) => dagLayout.get(d.id)?.x || 0)
        .attr('cy', (d) => dagLayout.get(d.id)?.y || 0)
        .attr('fill', (d) => {
          // We need to use the global cohort index for consistent coloring
          if (!data?.cohorts) return colors.regularNode;

          const globalIndex = data.cohorts.findIndex((cohort) =>
            cohort.includes(d.id)
          );
          return colorScale(globalIndex.toString());
        })
        .attr('stroke', (d) => (d.isTip ? colors.tipNode : colors.nodeStroke))
        .attr('stroke-width', (d) => (d.isTip ? 3 : 1.5))
        .on('mouseover', (event, d) => {
          if (tooltip) {
            tooltip.transition().duration(200).style('opacity', 0.9);
            tooltip
              .html(
                `
              <div>
                <strong>ID:</strong> ${d.id}<br/>
                <strong>Cohort:</strong> ${d.cohort}<br/>
                <strong>Parents:</strong> ${d.parents.join(', ')}<br/>
                <strong>Children:</strong> ${d.children.join(', ')}<br/>
                <strong>Tip:</strong> ${d.isTip ? 'Yes' : 'No'}
              </div>
            `
              )
              .style('left', event.pageX + 10 + 'px')
              .style('top', event.pageY - 28 + 'px');
          }
        })
        .on('mouseout', () => {
          if (tooltip) {
            tooltip.transition().duration(500).style('opacity', 0);
          }
        });

      // Add text labels for node IDs if not too many nodes
      if (visibleData.nodes.length < 200) {
        svg
          .append('g')
          .selectAll('text')
          .data(visibleData.nodes)
          .enter()
          .append('text')
          .attr('x', (d) => dagLayout.get(d.id)?.x || 0)
          .attr('y', (d) => dagLayout.get(d.id)?.y || 0)
          .attr('dy', '.35em')
          .attr('text-anchor', 'middle')
          .style('fill', colors.textPrimary)
          .style('font-size', '10px')
          .style('pointer-events', 'none')
          .text((d) => d.id.toString());
      }
    } catch (error) {
      console.error('❌ Error rendering visualization:', error);
      setRenderError(
        `Error rendering: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    return () => {
      // Cleanup
      try {
        if (tooltip) tooltip.remove();
      } catch (error) {
        console.error('❌ Error cleaning up tooltip:', error);
      }
    };
  }, [visibleData, svgWidth, height, colorScale, zoomLevel, data?.cohorts]);

  // Render minimap
  useEffect(() => {
    if (!minimapRef.current || !data?.cohorts?.length) {
      return;
    }

    try {
      // Clear previous minimap
      d3.select(minimapRef.current).selectAll('*').remove();

      const svg = d3.select(minimapRef.current);
      const minimapWidth = svgWidth * 0.3;
      const minimapHeight = 60;

      // Draw background
      svg
        .append('rect')
        .attr('width', minimapWidth)
        .attr('height', minimapHeight)
        .attr('fill', colors.paper)
        .attr('stroke', colors.border)
        .attr('stroke-width', 1);

      // Draw cohort indicators
      const cohortWidth = minimapWidth / data.cohorts.length;

      svg
        .selectAll('.cohort-indicator')
        .data(data.cohorts)
        .enter()
        .append('rect')
        .attr('class', 'cohort-indicator')
        .attr('x', (_, i) => i * cohortWidth)
        .attr('y', 0)
        .attr('width', cohortWidth)
        .attr('height', minimapHeight)
        .attr('fill', (_, i) => colorScale(i.toString()))
        .attr('opacity', 0.5);

      // Draw window indicator
      const windowRect = svg
        .append('rect')
        .attr('class', 'window-indicator')
        .attr('x', windowStart * cohortWidth)
        .attr('y', 0)
        .attr('width', windowSize * cohortWidth)
        .attr('height', minimapHeight)
        .attr('fill', 'none')
        .attr('stroke', colors.tipNode)
        .attr('stroke-width', 2)
        .style('cursor', 'move');

      // Make minimap interactive
      svg.on('click', (event) => {
        // Use d3.pointer safely with nullish coalescing
        const pointer = event ? d3.pointer(event) : [0, 0];
        const [x] = pointer;
        const clickedCohort = Math.floor(x / cohortWidth);

        // Center window on clicked cohort
        const newStart = Math.max(
          0,
          Math.min(
            clickedCohort - Math.floor(windowSize / 2),
            data.cohorts.length - windowSize
          )
        );
        setWindowStart(newStart);
      });

      // Make window draggable
      const drag = d3
        .drag()
        .on('start', function (this: any) {
          if (this) d3.select(this).attr('stroke-width', 3);
        })
        .on('drag', (event) => {
          const newStart = Math.max(
            0,
            Math.min(
              Math.floor(event.x / cohortWidth),
              data.cohorts.length - windowSize
            )
          );
          setWindowStart(newStart);

          // Update window position during drag
          if (event.sourceEvent.currentTarget)
            d3.select(event.sourceEvent.currentTarget).attr(
              'x',
              newStart * cohortWidth
            );
        })
        .on('end', function (this: any) {
          if (this) d3.select(this).attr('stroke-width', 2);
        });

      windowRect.call(drag as any);
    } catch (error) {
      console.error('❌ Error rendering minimap:', error);
      setRenderError(
        `Error rendering minimap: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }, [data, windowStart, windowSize, svgWidth, colorScale]);

  // Handle window navigation
  const handleWindowChange = (event: any, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      setWindowStart(newValue);
    }
  };

  // Handle window size change
  const handleWindowSizeChange = (event: any, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      setWindowSize(newValue);
    }
  };

  // Handle zoom change
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Render cohort legend with pagination if needed
  const renderCohortLegendItems = useCallback(() => {
    if (!visibleData?.cohorts?.length) return null;

    // Calculate how to split cohorts into columns
    const columns = isExtraSmallScreen ? 2 : isSmallScreen ? 3 : 1;
    const itemsPerColumn = Math.ceil(visibleData.cohorts.length / columns);

    // Create column arrays
    const columnItems = Array.from({ length: columns }, (_, colIndex) => {
      const startIdx = colIndex * itemsPerColumn;
      const endIdx = Math.min(
        startIdx + itemsPerColumn,
        visibleData.cohorts.length
      );
      return Array.from({ length: endIdx - startIdx }, (_, i) => {
        const index = startIdx + i;
        // Get the global cohort index for this cohort
        const globalIndex = windowStart + index;

        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 0.75,
              mr: 1,
              minWidth: 'auto',
              width: '100%',
            }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                backgroundColor: colorScale(globalIndex.toString()),
                mr: 0.75,
                border: `1px solid ${colors.border}`,
                flexShrink: 0,
              }}
            />
            <Typography
              variant='caption'
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: colors.textPrimary,
              }}>{`Cohort ${globalIndex}`}</Typography>
          </Box>
        );
      });
    });

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant='subtitle2'
          sx={{ mb: 1, color: colors.textPrimary }}>
          Cohorts {windowStart} -{' '}
          {Math.min(windowStart + windowSize, totalCohorts)}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          {columnItems.map((column, i) => (
            <Box key={i} sx={{ flex: `1 1 ${100 / columns}%` }}>
              {column}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }, [
    visibleData,
    windowStart,
    windowSize,
    totalCohorts,
    colorScale,
    isExtraSmallScreen,
    isSmallScreen,
  ]);

  return (
    <Box ref={containerRef} sx={{ width: '100%', position: 'relative' }}>
      {renderError && (
        <Box
          sx={{
            p: 3,
            color: 'error.main',
            bgcolor: 'error.light',
            borderRadius: 1,
            mb: 2,
          }}>
          <Typography variant='h6'>Error Rendering Visualization</Typography>
          <Typography variant='body2'>{renderError}</Typography>
          <Typography variant='body2' sx={{ mt: 1 }}>
            Please try refreshing the page or contact support if the issue
            persists.
          </Typography>
        </Box>
      )}

      {/* Controls Bar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isSmallScreen ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          gap: 2,
        }}>
        <Typography variant='h6' sx={{ color: colors.textPrimary }}>
          Braid Visualization
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
          <IconButton onClick={handleZoomIn} size='small'>
            <ZoomIn />
          </IconButton>
          <IconButton onClick={handleZoomOut} size='small'>
            <ZoomOut />
          </IconButton>
          <IconButton onClick={handleResetZoom} size='small'>
            <Home />
          </IconButton>

          <Tooltip title='Toggle statistics'>
            <Typography
              variant='button'
              sx={{ cursor: 'pointer', color: colors.textPrimary }}
              onClick={() => setStatsVisible(!statsVisible)}>
              {statsVisible ? 'Hide Stats' : 'Show Stats'}
            </Typography>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Card */}
      {statsVisible && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant='subtitle1' gutterBottom>
              Visualization Statistics
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Total Cohorts
                </Typography>
                <Typography variant='body1'>{stats.totalCohorts}</Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Visible Cohorts
                </Typography>
                <Typography variant='body1'>{stats.visibleCohorts}</Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Total Nodes
                </Typography>
                <Typography variant='body1'>{stats.totalNodes}</Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Visible Nodes
                </Typography>
                <Typography variant='body1'>{stats.visibleNodes}</Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Zoom Level
                </Typography>
                <Typography variant='body1'>{zoomLevel.toFixed(2)}x</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: isSmallScreen ? 'column' : 'row',
        }}>
        {/* Main Visualization */}
        <Box
          sx={{
            flex: '1 1 auto',
            border: `1px solid ${colors.border}`,
            borderRadius: 1,
            position: 'relative',
            overflow: 'hidden',
          }}>
          {isLoading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: height,
                color: colors.textPrimary,
              }}>
              <Typography>Loading visualization...</Typography>
            </Box>
          ) : !visibleData ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: height,
                color: colors.textPrimary,
              }}>
              <Typography>No data available</Typography>
            </Box>
          ) : (
            <svg
              ref={svgRef}
              width={svgWidth}
              height={height}
              style={{ display: 'block' }}
              viewBox={`0 0 ${svgWidth} ${height}`}
              preserveAspectRatio='xMidYMid meet'
            />
          )}
        </Box>

        {/* Legend */}
        {!isSmallScreen && (
          <Box
            sx={{
              width: 160,
              ml: 2,
              p: 1,
              border: `1px solid ${colors.border}`,
              borderRadius: 1,
              backgroundColor: colors.paper,
              overflow: 'auto',
              maxHeight: height,
            }}>
            <Typography
              variant='subtitle2'
              sx={{
                color: colors.textPrimary,
                mb: 1,
                borderBottom: `1px solid ${colors.border}`,
                pb: 0.5,
              }}>
              Legend
            </Typography>
            {renderCohortLegendItems()}
          </Box>
        )}
      </Box>

      {/* Navigation Controls */}
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant='body2' sx={{ color: colors.textPrimary }}>
            Cohort Window
          </Typography>
          <Typography variant='body2' sx={{ color: colors.textPrimary }}>
            {windowStart} - {Math.min(windowStart + windowSize, totalCohorts)}{' '}
            of {totalCohorts}
          </Typography>
        </Box>

        {/* Minimap */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
            position: 'relative',
          }}>
          <svg
            ref={minimapRef}
            width={svgWidth * 0.3}
            height={60}
            style={{ display: 'block' }}
          />
        </Box>

        {/* Window Slider */}
        <Slider
          value={windowStart}
          onChange={handleWindowChange}
          min={0}
          max={Math.max(0, totalCohorts - windowSize)}
          step={1}
          aria-labelledby='cohort-window-slider'
          sx={{ mb: 3 }}
        />

        {/* Window Size Slider */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant='body2' sx={{ color: colors.textPrimary }}>
            Window Size
          </Typography>
          <Typography variant='body2' sx={{ color: colors.textPrimary }}>
            {windowSize} cohorts
          </Typography>
        </Box>
        <Slider
          value={windowSize}
          onChange={handleWindowSizeChange}
          min={50}
          max={Math.min(500, totalCohorts)}
          step={10}
          aria-labelledby='window-size-slider'
        />
      </Box>

      {/* Mobile Legend (shown below visualization on small screens) */}
      {isSmallScreen && (
        <Box
          sx={{
            mt: 2,
            p: 1,
            border: `1px solid ${colors.border}`,
            borderRadius: 1,
            backgroundColor: colors.paper,
          }}>
          <Typography
            variant='subtitle2'
            sx={{
              color: colors.textPrimary,
              mb: 1,
              borderBottom: `1px solid ${colors.border}`,
              pb: 0.5,
            }}>
            Legend
          </Typography>
          {renderCohortLegendItems()}
        </Box>
      )}
    </Box>
  );
};

// Helper function to create a DAG layout
const createDagLayout = (
  data: BraidVisualizationData,
  width: number,
  height: number,
  zoomLevel: number = 1
): Map<number, { x: number; y: number }> => {
  const positions = new Map<number, { x: number; y: number }>();
  const padding = 50;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

  // Group nodes by cohort
  const nodesByCohort = new Map<number, number[]>();
  data.nodes.forEach((node) => {
    if (!nodesByCohort.has(node.cohort)) {
      nodesByCohort.set(node.cohort, []);
    }
    nodesByCohort.get(node.cohort)?.push(node.id);
  });

  // Sort cohorts by index
  const sortedCohorts = Array.from(nodesByCohort.entries()).sort(
    ([a], [b]) => a - b
  );

  // Position nodes in a grid, with cohorts laid out horizontally
  const cohortWidth = availableWidth / Math.max(1, sortedCohorts.length);

  // Apply zoom to expand the horizontal spacing
  const scaledCohortWidth = cohortWidth * zoomLevel;

  sortedCohorts.forEach(([cohortIndex, nodeIds], columnIndex) => {
    const nodeHeight = availableHeight / Math.max(1, nodeIds.length);

    nodeIds.forEach((nodeId, rowIndex) => {
      positions.set(nodeId, {
        // Apply zoom level to x-coordinate for horizontal expansion/contraction
        x: padding + columnIndex * scaledCohortWidth + scaledCohortWidth / 2,
        y: padding + rowIndex * nodeHeight + nodeHeight / 2,
      });
    });
  });

  return positions;
};

export default BraidVisualizationOptimized;
