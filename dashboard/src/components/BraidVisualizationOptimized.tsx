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
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import colors from '../theme/colors';
import {
  ZoomIn,
  ZoomOut,
  Home,
  ArrowForward,
  ArrowBack,
  FirstPage,
  LastPage,
  NavigateNext,
  NavigateBefore,
  GridOn as GridOnIcon,
  Layers as LayersIcon,
  Stop as StopIcon,
} from '@mui/icons-material';

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
  const jumpToInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isExtraSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [renderError, setRenderError] = useState<string | null>(null);

  // State for visualization
  const [svgWidth, setSvgWidth] = useState(width);
  const [windowStart, setWindowStart] = useState(0);
  const [windowSize, setWindowSize] = useState(10); // Reduced from 100 to 10 for smaller datasets
  const [totalCohorts, setTotalCohorts] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [visibleData, setVisibleData] = useState<BraidVisualizationData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [statsVisible, setStatsVisible] = useState(false);
  const [jumpToCohort, setJumpToCohort] = useState<string>('');

  // Layout options
  const [layoutMode, setLayoutMode] = useState<'force' | 'grid' | 'braid'>(
    'braid'
  );
  const [simulationRunning, setSimulationRunning] = useState(false);
  const simulationRef = useRef<any>(null);

  // Stats
  const [stats, setStats] = useState({
    totalNodes: 0,
    visibleNodes: 0,
    totalCohorts: 0,
    visibleCohorts: 0,
    cohortSizeDistribution: {} as Record<string, number>,
  });

  // Add simulation timeout reference
  const simulationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        const cohortCount = data.cohorts.length;
        setTotalCohorts(cohortCount);

        // Dynamically adjust window size based on total cohorts
        let dynamicWindowSize = Math.max(5, Math.min(cohortCount, windowSize));

        // For very large datasets (>1000 cohorts), use a larger default window
        if (cohortCount > 1000) {
          // For extremely large datasets (>3000), increase default even more
          if (cohortCount > 3000 && windowSize < 100) {
            console.log(
              `🔄 Extremely large dataset detected (${cohortCount} cohorts), increasing window size to 100`
            );
            dynamicWindowSize = Math.min(100, cohortCount);
          }
          // For large datasets (>1000), use moderate window size
          else if (windowSize < 50) {
            console.log(
              `🔄 Large dataset detected (${cohortCount} cohorts), increasing window size to 50`
            );
            dynamicWindowSize = Math.min(50, cohortCount);
          }
        }

        if (dynamicWindowSize !== windowSize) {
          console.log(
            `🔄 Adjusting window size to ${dynamicWindowSize} for ${cohortCount} total cohorts`
          );
          setWindowSize(dynamicWindowSize);
        }

        setStats((prev) => ({
          ...prev,
          totalNodes: data.nodes.length,
          totalCohorts: cohortCount,
        }));
      }

      // Initialize window to show the most recent cohorts, but only if we have enough cohorts
      if (data?.cohorts?.length && data.cohorts.length > windowSize) {
        setWindowStart(data.cohorts.length - windowSize);
      } else {
        // For small datasets, start at the beginning
        setWindowStart(0);
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

  // Add stop simulation function
  const stopSimulation = useCallback(() => {
    if (simulationRef.current) {
      console.log('🛑 Manually stopping force simulation');
      simulationRef.current.stop();
      simulationRef.current = null;
      setSimulationRunning(false);
    }
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
      simulationTimeoutRef.current = null;
    }
  }, []);

  // Render main visualization
  const renderVisualization = useCallback(() => {
    if (!svgRef.current || !visibleData || !visibleData.nodes.length) {
      return;
    }

    try {
      setRenderError(null);
      const svg = d3.select(svgRef.current);

      // Clear previous content
      svg.selectAll('*').remove();

      const g = svg.append('g');

      // Add arrow marker definition for directed edges
      svg
        .append('defs')
        .selectAll('marker')
        .data(['arrow'])
        .enter()
        .append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', colors.border);

      // Calculate layout
      const dagLayout = createDagLayout(
        visibleData,
        svgWidth,
        height,
        zoomLevel,
        layoutMode
      );

      // If braid layout, create background highlighting for cohorts
      if (layoutMode === 'braid') {
        // Group nodes by cohort
        const cohortGroups = new Map<number, { x: number; nodes: number[] }>();

        visibleData.nodes.forEach((node) => {
          const pos = dagLayout.get(node.id);
          if (!pos) return;

          if (!cohortGroups.has(node.cohort)) {
            cohortGroups.set(node.cohort, { x: pos.x, nodes: [node.id] });
          } else {
            cohortGroups.get(node.cohort)?.nodes.push(node.id);
          }
        });

        // Draw background rectangles for cohorts
        g.insert('g', ':first-child')
          .attr('class', 'cohort-backgrounds')
          .selectAll('rect')
          .data(Array.from(cohortGroups.entries()))
          .enter()
          .append('rect')
          .attr('x', (d) => d[1].x - 20) // Slightly wider than node positions
          .attr('width', 40)
          .attr('y', 0)
          .attr('height', height)
          .attr('fill', (d, i) => {
            const cohortColors = [
              '#ff704320', // Orange with opacity
              '#42a5f520', // Blue with opacity
              '#66bb6a20', // Green with opacity
              '#ec407a20', // Pink with opacity
              '#7e57c220', // Purple with opacity
              '#ffca2820', // Amber with opacity
              '#26c6da20', // Cyan with opacity
              '#8d6e6320', // Brown with opacity
              '#bdbdbd20', // Gray with opacity
              '#5c6bc020', // Indigo with opacity
            ];
            return cohortColors[d[0] % cohortColors.length];
          });

        // Add vertical cohort separator lines
        g.insert('g', ':first-child')
          .attr('class', 'cohort-separators')
          .selectAll('line')
          .data(Array.from(cohortGroups.entries()))
          .enter()
          .append('line')
          .filter((d, i) => i > 0) // Skip first cohort
          .attr('x1', (d) => d[1].x - 20)
          .attr('x2', (d) => d[1].x - 20)
          .attr('y1', 0)
          .attr('y2', height)
          .attr('stroke', colors.border)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.5);
      }

      // Create container for links
      const links = g
        .append('g')
        .attr('class', 'links')
        .selectAll('path')
        .data(visibleData.links)
        .enter()
        .append('path')
        .attr(
          'class',
          (d) => `link ${d.isHighWorkPath ? 'high-work-path' : ''}`
        )
        .attr('stroke', (d) =>
          d.isHighWorkPath ? colors.accent : colors.border
        )
        .attr('stroke-width', (d) => (d.isHighWorkPath ? 2 : 1))
        .attr('fill', 'none')
        .attr('marker-end', 'url(#arrow)') // Add arrowhead markers
        .attr('opacity', 0.7)
        .attr('d', (d) => {
          const source = dagLayout.get(d.source);
          const target = dagLayout.get(d.target);

          if (!source || !target) return '';

          const dx = target.x - source.x;
          const dy = target.y - source.y;

          if (layoutMode === 'braid') {
            // For DAG layout, use curved paths that clearly show direction
            // Straight lines for closely positioned nodes (mainly within same cohort)
            if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
              return `M${source.x},${source.y}L${target.x},${target.y}`;
            }

            // For nodes with significant horizontal distance (cross-cohort connections)
            if (Math.abs(dx) > Math.abs(dy)) {
              // Control points for natural curve
              const midX = source.x + dx * 0.6;
              const midY = source.y + dy * 0.6;

              // Smooth S-curve for horizontal connections
              return `M${source.x},${source.y} C${midX},${source.y} ${midX},${target.y} ${target.x},${target.y}`;
            }

            // For vertical connections or diagonal connections, use arc
            const dr = Math.sqrt(dx * dx + dy * dy) * 0.8;
            return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
          } else {
            // For other layouts, use simple straight lines
            return `M${source.x},${source.y}L${target.x},${target.y}`;
          }
        });

      // Create container for nodes
      const nodes = g
        .append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(visibleData.nodes)
        .enter()
        .append('g')
        .attr('class', (d) => `node cohort-${d.cohort % 10}`)
        .attr('transform', (d) => {
          const pos = dagLayout.get(d.id);
          // Ensure we have valid coordinates
          if (!pos || pos.x === undefined || pos.y === undefined) {
            console.error(
              `❌ Missing position for node ${d.id}, using fallback`
            );
            return `translate(${svgWidth / 2},${height / 2})`;
          }
          return `translate(${pos.x},${pos.y})`;
        });

      // Add circles for nodes
      nodes
        .append('circle')
        .attr('r', (d) => (d.isTip ? 8 : 6) * zoomLevel) // Tips are larger
        .attr('fill', (d) => {
          // Color by cohort with a consistent pattern
          const cohortColors = [
            '#ff7043', // Orange
            '#42a5f5', // Blue
            '#66bb6a', // Green
            '#ec407a', // Pink
            '#7e57c2', // Purple
            '#ffca28', // Amber
            '#26c6da', // Cyan
            '#8d6e63', // Brown
            '#bdbdbd', // Gray
            '#5c6bc0', // Indigo
          ];
          return d.isTip
            ? colors.accent
            : cohortColors[d.cohort % cohortColors.length];
        })
        .attr('stroke', colors.background)
        .attr('stroke-width', 1);

      // Add node IDs as text
      nodes
        .append('text')
        .attr('dx', 12 * zoomLevel)
        .attr('dy', 4 * zoomLevel)
        .attr('font-size', `${12 * zoomLevel}px`)
        .text((d) => `${d.id}`)
        .attr('fill', colors.textPrimary);

      // Add cohort labels for nodes
      nodes
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', -10 * zoomLevel)
        .attr('font-size', `${10 * zoomLevel}px`)
        .text((d) => `C${d.cohort}`)
        .attr('fill', colors.textSecondary);

      // Create tooltip
      const tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background-color', colors.paper)
        .style('color', colors.textPrimary)
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('box-shadow', '0 2px 10px rgba(0,0,0,0.2)')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 1000);

      // Add hover effect to nodes
      nodes
        .on('mouseover', (event, d) => {
          if (tooltip) {
            tooltip.transition().duration(200).style('opacity', 0.9);
            tooltip
              .html(
                `<strong>Node ID:</strong> ${d.id}<br>` +
                  `<strong>Cohort:</strong> ${d.cohort}<br>` +
                  `<strong>Parents:</strong> ${d.parents.join(', ')}<br>` +
                  `<strong>Children:</strong> ${d.children.join(', ')}<br>` +
                  `<strong>Is Tip:</strong> ${d.isTip ? 'Yes' : 'No'}`
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

      // Add zoom effect
      if (zoomLevel !== 1) {
        g.attr('transform', `scale(${zoomLevel})`);
      }

      // Clean up any old tooltips when component unmounts
      return () => {
        d3.select('body').selectAll('.tooltip').remove();
      };
    } catch (error) {
      console.error('❌ Error rendering visualization:', error);
      setRenderError(
        `Error rendering visualization: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }, [
    visibleData,
    svgWidth,
    height,
    zoomLevel,
    layoutMode,
    colors.accent,
    colors.border,
    colors.background,
    colors.textPrimary,
    colors.textSecondary,
    colors.paper,
  ]);

  // Add useEffect to call renderVisualization
  useEffect(() => {
    if (visibleData) {
      const cleanup = renderVisualization();
      return () => {
        if (cleanup && typeof cleanup === 'function') {
          cleanup();
        }
      };
    }
  }, [renderVisualization, visibleData]);

  // Render minimap with enhanced navigation for large datasets
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

      // Check if we need to show the minimap
      const showMinimap = data.cohorts.length > windowSize;

      // Draw background
      svg
        .append('rect')
        .attr('width', minimapWidth)
        .attr('height', minimapHeight)
        .attr('fill', colors.paper)
        .attr('stroke', colors.border)
        .attr('stroke-width', 1);

      if (!showMinimap) {
        // For small datasets, just add a message
        svg
          .append('text')
          .attr('x', minimapWidth / 2)
          .attr('y', minimapHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', '10px')
          .style('fill', colors.textSecondary)
          .text(`All ${data.cohorts.length} cohorts visible`);
        return;
      }

      // Draw cohort indicators (we'll optimize for large datasets)
      const cohortWidth = minimapWidth / data.cohorts.length;

      // For very large datasets, we don't draw individual cohort indicators
      // but instead draw indicator regions
      if (data.cohorts.length > 500) {
        // Create a gradient effect to represent density
        const regions = 20; // Split into 20 regions
        const regionWidth = minimapWidth / regions;
        const cohortsPerRegion = data.cohorts.length / regions;

        for (let i = 0; i < regions; i++) {
          svg
            .append('rect')
            .attr('x', i * regionWidth)
            .attr('y', 0)
            .attr('width', regionWidth)
            .attr('height', minimapHeight)
            .attr('fill', d3.interpolateBlues((i + 1) / regions))
            .attr('opacity', 0.5);

          // Add labels at intervals
          if (i % 4 === 0) {
            svg
              .append('text')
              .attr('x', i * regionWidth + regionWidth / 2)
              .attr('y', minimapHeight - 5)
              .attr('text-anchor', 'middle')
              .style('font-size', '8px')
              .style('fill', colors.textSecondary)
              .text(Math.round(i * cohortsPerRegion));
          }
        }
      } else {
        // For smaller datasets, draw individual indicators
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
      }

      // Draw window indicator
      const windowRect = svg
        .append('rect')
        .attr('class', 'window-indicator')
        .attr('x', (windowStart / data.cohorts.length) * minimapWidth)
        .attr('y', 0)
        .attr(
          'width',
          Math.max(3, (windowSize / data.cohorts.length) * minimapWidth)
        )
        .attr('height', minimapHeight)
        .attr('fill', 'none')
        .attr('stroke', colors.tipNode)
        .attr('stroke-width', 2)
        .style('cursor', 'move');

      // Add current position text
      svg
        .append('text')
        .attr('class', 'position-indicator')
        .attr('x', minimapWidth / 2)
        .attr('y', minimapHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', colors.textPrimary)
        .text(
          `${windowStart} - ${Math.min(windowStart + windowSize, totalCohorts)}`
        );

      // Make minimap interactive
      svg.on('click', (event) => {
        // Use d3.pointer safely with nullish coalescing
        const pointer = event ? d3.pointer(event) : [0, 0];
        const [x] = pointer;
        const clickedPosition = Math.floor(
          (x / minimapWidth) * data.cohorts.length
        );

        // Center window on clicked position
        const newStart = Math.max(
          0,
          Math.min(
            clickedPosition - Math.floor(windowSize / 2),
            data.cohorts.length - windowSize
          )
        );
        setWindowStart(newStart);
        console.log(
          `🔍 Clicked on minimap at position ${clickedPosition}, new window: ${newStart}-${
            newStart + windowSize
          }`
        );
      });

      // Make window draggable
      const drag = d3
        .drag()
        .on('start', function (this: any) {
          if (this) d3.select(this).attr('stroke-width', 3);
        })
        .on('drag', (event) => {
          const dragPosition = event.x / minimapWidth;
          const newStart = Math.max(
            0,
            Math.min(
              Math.floor(dragPosition * data.cohorts.length),
              data.cohorts.length - windowSize
            )
          );
          setWindowStart(newStart);

          // Update window position during drag
          const windowWidth = Math.max(
            3,
            (windowSize / data.cohorts.length) * minimapWidth
          );
          d3.select('.window-indicator').attr(
            'x',
            (newStart / data.cohorts.length) * minimapWidth
          );

          // Update the position text
          d3.select('.position-indicator').text(
            `${newStart} - ${Math.min(newStart + windowSize, totalCohorts)}`
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
  }, [data, windowStart, windowSize, svgWidth, colorScale, totalCohorts]);

  // Handle window navigation
  const handleWindowChange = (event: any, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      console.log(`🔄 Window start changed: ${windowStart} → ${newValue}`);
      setWindowStart(newValue);
    }
  };

  // Page navigation helpers
  const handleJumpToFirst = () => {
    setWindowStart(0);
    console.log(`🔄 Jumped to first page (cohorts 0-${windowSize})`);
  };

  const handleJumpToLast = () => {
    const newStart = Math.max(0, totalCohorts - windowSize);
    setWindowStart(newStart);
    console.log(`🔄 Jumped to last page (cohorts ${newStart}-${totalCohorts})`);
  };

  const handleJumpBack = () => {
    // Jump back by windowSize or to the beginning
    const newStart = Math.max(0, windowStart - windowSize);
    setWindowStart(newStart);
    console.log(
      `🔄 Jumped back to cohorts ${newStart}-${newStart + windowSize}`
    );
  };

  const handleJumpForward = () => {
    // Jump forward by windowSize or to the end
    const newStart = Math.min(
      totalCohorts - windowSize,
      windowStart + windowSize
    );
    setWindowStart(newStart);
    console.log(
      `🔄 Jumped forward to cohorts ${newStart}-${newStart + windowSize}`
    );
  };

  // Handle jump to preset positions
  const handleJumpToPosition = (position: number) => {
    // Ensure position is within bounds
    const targetPosition = Math.max(
      0,
      Math.min(position, totalCohorts - windowSize)
    );
    setWindowStart(targetPosition);
    console.log(
      `🔄 Jumped to position ${targetPosition} (range: ${targetPosition}-${
        targetPosition + windowSize
      })`
    );
  };

  // Create preset jump buttons based on total cohorts
  const renderPresetJumpButtons = useCallback(() => {
    if (totalCohorts <= 500) return null; // Only for very large datasets

    // Calculate reasonable jumps based on cohort count
    // For datasets with thousands of cohorts, show jumps at even intervals
    const interval = Math.floor(totalCohorts / 5); // 5 intervals
    const positions = Array.from({ length: 4 }, (_, i) => (i + 1) * interval);

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 1,
          mb: 2,
        }}>
        <Typography
          variant='caption'
          sx={{
            width: '100%',
            textAlign: 'center',
            mb: 1,
            color: colors.textSecondary,
          }}>
          Jump to cohort:
        </Typography>
        {positions.map((pos) => (
          <Button
            key={pos}
            size='small'
            variant='outlined'
            onClick={() => handleJumpToPosition(pos)}
            sx={{
              minWidth: 'auto',
              px: 1,
              color:
                Math.abs(windowStart - pos) < windowSize
                  ? colors.tipNode
                  : colors.textPrimary,
              borderColor:
                Math.abs(windowStart - pos) < windowSize
                  ? colors.tipNode
                  : colors.border,
            }}>
            {pos}
          </Button>
        ))}
      </Box>
    );
  }, [totalCohorts, windowSize, windowStart]);

  // Handle jump to specific cohort
  const handleJumpToCohort = () => {
    const cohortIndex = parseInt(jumpToCohort);
    if (!isNaN(cohortIndex) && cohortIndex >= 0 && cohortIndex < totalCohorts) {
      // Center the window around the requested cohort if possible
      const halfWindow = Math.floor(windowSize / 2);
      let newStart = Math.max(0, cohortIndex - halfWindow);

      // Adjust if we're too close to the end
      if (newStart + windowSize > totalCohorts) {
        newStart = Math.max(0, totalCohorts - windowSize);
      }

      setWindowStart(newStart);
      console.log(
        `🔄 Jumped to cohort ${cohortIndex} (window: ${newStart}-${
          newStart + windowSize
        })`
      );
    }
    // Clear the input after jumping
    setJumpToCohort('');
  };

  // Handle window size change
  const handleWindowSizeChange = (event: any, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      console.log(`🔄 Window size changed: ${windowSize} → ${newValue}`);
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
    <Box ref={containerRef} sx={{ width: '100%' }}>
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

      <Box sx={{ position: 'relative' }}>
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 600,
            }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <svg
              ref={svgRef}
              width={svgWidth}
              height={height}
              style={{
                backgroundColor: colors.paper,
                borderRadius: 4,
              }}
            />
            {minimapRef.current && (
              <svg
                ref={minimapRef}
                width={svgWidth * 0.3}
                height={60}
                style={{ display: 'block' }}
              />
            )}
          </>
        )}
      </Box>

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
        <Typography
          variant='h6'
          sx={{
            color: colors.textPrimary,
            display: 'flex',
            alignItems: 'center',
          }}>
          Braid Visualization
          {simulationRunning && (
            <>
              <CircularProgress size={16} sx={{ ml: 1, mr: 1 }} />
              <span>Simulating...</span>
              <IconButton
                size='small'
                onClick={stopSimulation}
                title='Stop simulation'
                sx={{ ml: 1 }}>
                <StopIcon fontSize='small' />
              </IconButton>
            </>
          )}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ mr: 1 }}>
              Layout:
            </Typography>
            <IconButton
              onClick={() => setLayoutMode('braid')}
              color={layoutMode === 'braid' ? 'primary' : 'default'}
              title='Braid layout'>
              <i className='fa fa-code-branch' />
            </IconButton>
            <IconButton
              onClick={() => setLayoutMode('grid')}
              color={layoutMode === 'grid' ? 'primary' : 'default'}
              title='Grid layout'>
              <GridOnIcon />
            </IconButton>
            <IconButton
              onClick={() => setLayoutMode('force')}
              color={layoutMode === 'force' ? 'primary' : 'default'}
              title='Force-directed layout'>
              <LayersIcon />
            </IconButton>
          </Box>

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

              {stats.totalCohorts > 0 && (
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Window Percent
                  </Typography>
                  <Typography variant='body1'>
                    {((windowSize / stats.totalCohorts) * 100).toFixed(1)}%
                  </Typography>
                </Box>
              )}
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
          <Typography
            variant='body2'
            sx={{ color: colors.textPrimary, fontWeight: 'bold' }}>
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
          {minimapRef.current && (
            <svg
              ref={minimapRef}
              width={svgWidth * 0.3}
              height={60}
              style={{ display: 'block' }}
            />
          )}
        </Box>

        {/* Preset Jump Buttons for large datasets */}
        {renderPresetJumpButtons()}

        {/* Pagination Controls */}
        {totalCohorts > windowSize && (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', mb: 2, gap: 1 }}>
            <IconButton
              onClick={handleJumpToFirst}
              disabled={windowStart === 0}
              size='small'
              title='Jump to first cohort'>
              <FirstPage />
            </IconButton>

            <IconButton
              onClick={handleJumpBack}
              disabled={windowStart === 0}
              size='small'
              title={`Jump back ${windowSize} cohorts`}>
              <NavigateBefore />
            </IconButton>

            {/* Jump to specific cohort */}
            <TextField
              inputRef={jumpToInputRef}
              size='small'
              placeholder='Jump to...'
              value={jumpToCohort}
              onChange={(e) => setJumpToCohort(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJumpToCohort();
              }}
              sx={{ width: '120px' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      onClick={handleJumpToCohort}
                      edge='end'
                      size='small'
                      title='Jump to entered cohort'>
                      <ArrowForward fontSize='small' />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <IconButton
              onClick={handleJumpForward}
              disabled={windowStart + windowSize >= totalCohorts}
              size='small'
              title={`Jump forward ${windowSize} cohorts`}>
              <NavigateNext />
            </IconButton>

            <IconButton
              onClick={handleJumpToLast}
              disabled={windowStart + windowSize >= totalCohorts}
              size='small'
              title='Jump to last cohort'>
              <LastPage />
            </IconButton>
          </Box>
        )}

        {/* Window Slider */}
        <Slider
          value={windowStart}
          onChange={handleWindowChange}
          min={0}
          max={Math.max(0, totalCohorts - windowSize)}
          step={Math.max(1, Math.floor(totalCohorts / 100))}
          disabled={totalCohorts <= windowSize}
          aria-labelledby='cohort-window-slider'
          sx={{ mb: 3 }}
        />

        {totalCohorts <= windowSize && (
          <Typography
            variant='caption'
            sx={{
              color: colors.textSecondary,
              display: 'block',
              textAlign: 'center',
              mb: 2,
            }}>
            All cohorts are currently visible. Slider is disabled because
            dataset is small.
          </Typography>
        )}

        {/* Window Size Slider */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant='body2' sx={{ color: colors.textPrimary }}>
            Window Size
          </Typography>
          <Typography variant='body2' sx={{ color: colors.textPrimary }}>
            {windowSize} cohorts (
            {((windowSize / totalCohorts) * 100).toFixed(1)}% of total)
          </Typography>
        </Box>

        <Slider
          value={windowSize}
          onChange={handleWindowSizeChange}
          min={5}
          max={
            totalCohorts > 3000
              ? Math.min(500, totalCohorts)
              : totalCohorts > 1000
              ? Math.min(200, totalCohorts)
              : Math.max(10, totalCohorts)
          }
          step={totalCohorts > 3000 ? 25 : totalCohorts > 1000 ? 10 : 1}
          disabled={totalCohorts < 10}
          aria-labelledby='window-size-slider'
          marks={
            totalCohorts > 500
              ? [
                  { value: 5, label: '5' },
                  { value: Math.min(50, totalCohorts), label: '50' },
                  { value: Math.min(100, totalCohorts), label: '100' },
                  { value: Math.min(200, totalCohorts), label: '200' },
                  {
                    value: Math.min(500, totalCohorts),
                    label: totalCohorts > 500 ? '500' : totalCohorts.toString(),
                  },
                ]
              : undefined
          }
        />

        {totalCohorts < 10 && (
          <Typography
            variant='caption'
            sx={{
              color: colors.textSecondary,
              display: 'block',
              textAlign: 'center',
              mt: 1,
            }}>
            Window size slider disabled - not enough cohorts ({totalCohorts}{' '}
            total)
          </Typography>
        )}

        {totalCohorts > 1000 && (
          <Typography
            variant='caption'
            sx={{
              color: colors.textSecondary,
              display: 'block',
              textAlign: 'center',
              mt: 1,
            }}>
            Large dataset detected ({totalCohorts} cohorts) - adjust window size
            to balance performance and visibility
          </Typography>
        )}
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
  zoomLevel: number,
  layoutMode: 'force' | 'grid' | 'braid'
): Map<number, { x: number; y: number }> => {
  if (!data?.nodes || !data.nodes.length || !data.cohorts) {
    console.error('❌ Missing data for layout calculation');
    return new Map();
  }

  const positions = new Map<number, { x: number; y: number }>();
  const padding = 20;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

  // To create a stable sort of cohorts, we'll assign positions to nodes
  // based on their cohort and relative position within the cohort.
  // This maintains the temporal left-to-right ordering.
  const cohortCount = data.cohorts.length;
  const maxCohortSize = Math.max(...data.cohorts.map((c) => c.length));

  // First collect all node IDs and organize by cohort for easier reference
  const nodesByCohort = new Map<number, number[]>();

  data.cohorts.forEach((cohort, cohortIndex) => {
    nodesByCohort.set(cohortIndex, cohort);
  });

  // Get node index within cohort
  const getNodeVerticalRank = (nodeId: number, cohortIndex: number): number => {
    const cohortNodes = nodesByCohort.get(cohortIndex) || [];
    return cohortNodes.indexOf(nodeId);
  };

  // Sort cohorts by index
  const sortedCohorts = Array.from(nodesByCohort.entries()).sort(
    (a, b) => a[0] - b[0]
  );

  // For braid layout, we'll first determine node positions based on their parents
  // to create a more natural flow, then adjust as needed
  if (layoutMode === 'braid') {
    // Step 1: Calculate x-positions based on cohort
    // Use even spacing between cohorts, but allow for variable widths
    const cohortSpacing = availableWidth / cohortCount;

    // Create a map of nodes by ID and track connections for better layout
    const nodeConnections = new Map<
      number,
      { parents: number[]; children: number[] }
    >();
    const cohortByNode = new Map<number, number>();

    // Initialize nodeConnections with empty arrays
    data.nodes.forEach((node) => {
      nodeConnections.set(node.id, { parents: [], children: [] });
      cohortByNode.set(node.id, node.cohort);
    });

    // Build the connection structure
    data.links.forEach((link) => {
      const sourceConn = nodeConnections.get(link.source);
      const targetConn = nodeConnections.get(link.target);

      if (sourceConn) sourceConn.children.push(link.target);
      if (targetConn) targetConn.parents.push(link.source);
    });

    console.log(
      `🔄 Setting up DAG layout with ${data.nodes.length} nodes and ${data.links.length} connections`
    );

    // Step 2: Assign initial y-positions for nodes in cohort 0 (roots)
    const rootCohort = nodesByCohort.get(0) || [];
    const rootSpacing = availableHeight / (rootCohort.length + 1);

    // Sort root nodes by number of descendants to place more central
    const rootsWithDescendants = rootCohort
      .map((nodeId) => {
        const descendantCount = countDescendants(nodeId, nodeConnections);
        return { nodeId, descendantCount };
      })
      .sort((a, b) => b.descendantCount - a.descendantCount);

    // Position roots with most children in the center
    rootsWithDescendants.forEach((root, i) => {
      // Use a more parabolic distribution for roots to place high-connection nodes centrally
      const normalizedPos = (i / (rootCohort.length - 1 || 1)) * 2 - 1; // -1 to 1
      const yOffset =
        ((normalizedPos * normalizedPos * -0.5 + 1) * availableHeight) / 2;

      const xPos = padding + cohortSpacing * 0.5; // First column
      const yPos = padding + yOffset;
      positions.set(root.nodeId, { x: xPos, y: yPos });
      console.log(
        `📍 Positioned root node ${root.nodeId} at (${xPos}, ${yPos}) with ${root.descendantCount} descendants`
      );
    });

    // Step 3: Progressively lay out each cohort based on parents and existing structure
    for (let cohortIndex = 1; cohortIndex < cohortCount; cohortIndex++) {
      const cohortNodes = nodesByCohort.get(cohortIndex) || [];
      const xPos = padding + cohortSpacing * (cohortIndex + 0.5);

      // Instead of just sorting by parent position, we'll create a more complex
      // arrangement that considers both ancestors and descendants
      const nodesWithConnectionInfo = cohortNodes.map((nodeId) => {
        const connections = nodeConnections.get(nodeId) || {
          parents: [],
          children: [],
        };

        // Calculate average parent position (weighted by number of connections)
        let parentYSum = 0;
        let parentWeight = 0;

        connections.parents.forEach((parentId) => {
          const parentPos = positions.get(parentId);
          if (parentPos) {
            // Calculate weight based on parent's importance
            const weight = nodeConnections.get(parentId)?.children.length || 1;
            parentYSum += parentPos.y * weight;
            parentWeight += weight;
          }
        });

        // If no parents positioned yet, use middle of screen
        const avgParentY =
          parentWeight > 0 ? parentYSum / parentWeight : height / 2;
        const descendantCount = countDescendants(nodeId, nodeConnections);
        const hasParents = connections.parents.length > 0;

        return {
          nodeId,
          avgParentY,
          hasParents,
          parentCount: connections.parents.length,
          childCount: connections.children.length,
          descendantCount,
        };
      });

      // Multi-factor sorting:
      // 1. First by parent positions to maintain flow
      // 2. Then by number of descendants to place more central nodes with more children
      nodesWithConnectionInfo.sort((a, b) => {
        // If both have parents, use parent position as primary sort
        if (a.hasParents && b.hasParents) {
          const posDiff = a.avgParentY - b.avgParentY;
          if (Math.abs(posDiff) > 30) return posDiff;

          // When parent positions are similar, secondarily sort by descendant count
          return b.descendantCount - a.descendantCount;
        }

        // Nodes with parents come before nodes without
        if (a.hasParents) return -1;
        if (b.hasParents) return 1;

        // For nodes without parents, sort by descendant count
        return b.descendantCount - a.descendantCount;
      });

      // Calculate optimal spacing based on node count
      const nodeSpacing = Math.min(
        40,
        availableHeight / (cohortNodes.length + 1)
      );

      // First pass: position nodes near their parents but don't resolve overlaps yet
      nodesWithConnectionInfo.forEach((nodeInfo, i) => {
        let yPos;

        if (nodeInfo.hasParents) {
          // Position near parent with slight offset
          yPos = nodeInfo.avgParentY;

          // Apply a proportional offset based on position in sorted cohort
          // to prevent immediate overlaps
          const centerIndex = cohortNodes.length / 2;
          const offset = (i - centerIndex) * (nodeSpacing * 0.5);
          yPos += offset;

          // For nodes with many children, bias towards center
          if (nodeInfo.childCount > 2) {
            yPos = (yPos * 2 + height / 2) / 3;
          }
        } else {
          // Default position if no parents - distribute evenly
          yPos = padding + nodeSpacing * (i + 1);
        }

        // Ensure within bounds
        yPos = Math.max(padding, Math.min(height - padding, yPos));
        positions.set(nodeInfo.nodeId, { x: xPos, y: yPos });
      });

      // Second pass: resolve overlaps within this cohort
      const minNodeSpacing = nodeSpacing * 0.8;

      // Sort by current Y position
      const positionedNodes = [...cohortNodes]
        .map((id) => ({ id, pos: positions.get(id) }))
        .filter((n) => n.pos !== undefined)
        .sort((a, b) => (a.pos?.y || 0) - (b.pos?.y || 0));

      // Fix overlaps by pushing nodes down
      for (let i = 1; i < positionedNodes.length; i++) {
        const curr = positionedNodes[i].pos!;
        const prev = positionedNodes[i - 1].pos!;

        if (curr.y - prev.y < minNodeSpacing) {
          curr.y = prev.y + minNodeSpacing;
        }
      }

      // Check if nodes now exceed the bottom boundary
      const lastNode = positionedNodes[positionedNodes.length - 1];
      if (lastNode && lastNode.pos!.y > height - padding) {
        // Calculate how much we need to shift everything up
        const excess = lastNode.pos!.y - (height - padding);

        // Distribute the adjustment proportionally
        positionedNodes.forEach((node, i) => {
          const ratio = i / (positionedNodes.length - 1);
          node.pos!.y -= excess * ratio;
        });
      }
    }

    // Helper function to count descendants recursively
    function countDescendants(
      nodeId: number,
      connections: Map<number, { parents: number[]; children: number[] }>
    ): number {
      const childrenIds = connections.get(nodeId)?.children || [];
      if (childrenIds.length === 0) return 0;

      // Count direct children plus their descendants
      return (
        childrenIds.length +
        childrenIds.reduce(
          (sum, childId) => sum + countDescendants(childId, connections),
          0
        )
      );
    }

    console.log(
      '📊 Created optimized DAG layout with enhanced parent-child relationships'
    );
    return positions;
  } else if (layoutMode === 'grid') {
    // Original grid layout logic
    sortedCohorts.forEach(([cohortIndex, nodeIds], columnIndex) => {
      const cohortSize = nodeIds.length;
      const xPos =
        padding + (columnIndex / Math.max(1, cohortCount - 1)) * availableWidth;

      nodeIds.forEach((nodeId, i) => {
        const yPos =
          padding + (i / Math.max(1, cohortSize - 1)) * availableHeight;
        positions.set(nodeId, { x: xPos, y: yPos });
      });
    });

    return positions;
  } else if (layoutMode === 'force') {
    // Apply a force-directed layout starting from the grid positions
    // First initialize with grid layout
    sortedCohorts.forEach(([cohortIndex, nodeIds], columnIndex) => {
      const cohortSize = nodeIds.length;
      const xPos =
        padding + (columnIndex / Math.max(1, cohortCount - 1)) * availableWidth;

      nodeIds.forEach((nodeId, i) => {
        const yPos =
          padding + (i / Math.max(1, cohortSize - 1)) * availableHeight;
        positions.set(nodeId, { x: xPos, y: yPos });
      });
    });

    if (data.nodes.length === 0 || data.links.length === 0) {
      return positions;
    }

    try {
      // Create node array with d3 expected format
      const nodes = data.nodes.map((node) => ({
        id: node.id,
        fx: positions.get(node.id)?.x, // Fix X position by cohort
        y: positions.get(node.id)?.y || 0,
      }));

      // Create link array with d3 expected format
      const links = data.links.map((link) => ({
        source: link.source,
        target: link.target,
      }));

      // Create a minimal force simulation that just adjusts Y positions
      // but keeps X positions fixed to maintain cohort arrangement
      const simulation = d3
        .forceSimulation(nodes)
        .force(
          'link',
          d3
            .forceLink(links)
            .id((d: any) => d.id)
            .distance(30)
            .strength(0.1)
        )
        .force('charge', d3.forceManyBody().strength(-10))
        .force('y', d3.forceY(height / 2).strength(0.03))
        .alphaDecay(0.2) // Fast decay for quick stabilization
        .velocityDecay(0.6) // High friction
        .alpha(0.3)
        .alphaMin(0.001);

      console.log('🧮 Running quick fine-tuning simulation...');

      // Run a fixed number of ticks immediately
      for (let i = 0; i < 20; i++) {
        simulation.tick();

        // Update node positions but keep x-coordinates fixed by cohort
        nodes.forEach((node: any) => {
          // Only adjust y-position within bounds
          node.y = Math.max(padding, Math.min(height - padding, node.y));

          // Update positions map
          positions.set(node.id, { x: node.fx, y: node.y });
        });
      }

      // Explicitly stop the simulation after fixed iterations
      console.log('✅ Layout fine-tuning completed');
      simulation.stop();

      // Return the positions with the simulation object
      (positions as any).simulation = simulation;
      return positions;
    } catch (error) {
      console.error('⚠️ Layout fine-tuning failed, using grid layout', error);
      // Already have grid positions, just return them
      return positions;
    }
  }

  return positions;
};

export default BraidVisualizationOptimized;
