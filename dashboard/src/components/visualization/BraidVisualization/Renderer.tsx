import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box, CircularProgress, Typography } from '@mui/material';
import { BraidVisualizationData } from '../../../types/braid';
import colors from '../../../theme/colors';

interface RendererProps {
  data: BraidVisualizationData | null;
  width: number;
  height: number;
  zoomLevel: number;
  layoutMode: 'force' | 'grid' | 'braid';
  simulationRunning: boolean;
  nodePositions: Map<string, { x: number; y: number }>;
  onNodeClick?: (nodeId: string) => void;
  isLoading: boolean;
}

const Renderer: React.FC<RendererProps> = ({
  data,
  width,
  height,
  zoomLevel,
  layoutMode,
  simulationRunning,
  nodePositions,
  onNodeClick,
  isLoading,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Don't render if there's no data or dimensions
    if (!data || !data.nodes || data.nodes.length === 0 || !width || !height) {
      return;
    }

    // Don't render if node positions haven't been calculated yet
    if (nodePositions.size === 0) {
      return;
    }

    console.log('🎨 Rendering visualization...');

    // Clear previous SVG content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Set up zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Create main group for all visualization elements
    const g = svg.append('g');

    // Define arrow marker for directed edges
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

    // Draw links (edges)
    g.append('g')
      .selectAll('path')
      .data(data.links)
      .enter()
      .append('path')
      .attr('d', (d) => {
        const source = nodePositions.get(d.source) || { x: 0, y: 0 };
        const target = nodePositions.get(d.target) || { x: 0, y: 0 };

        // Use straight lines for the path
        return `M${source.x},${source.y} L${target.x},${target.y}`;
      })
      .attr('fill', 'none')
      .attr('stroke', (d) =>
        d.isHighWorkPath ? colors.highWorkPathColor : colors.linkColor
      )
      .attr('stroke-width', (d) => (d.isHighWorkPath ? 2 : 1))
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrow)');

    // Draw nodes
    const nodes = g
      .append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('cx', (d) => nodePositions.get(d.id)?.x || 0)
      .attr('cy', (d) => nodePositions.get(d.id)?.y || 0)
      .attr('r', (d) => (d.isTip ? 6 : 4))
      .attr('fill', (d) => {
        if (d.isOnHighWorkPath) return colors.highWorkPathColor;

        // Use cohort-based coloring
        const cohortCount = data.cohorts.length;
        const colorIndex = d.cohort % 10; // Limit to 10 colors to avoid too much variation
        return d3.schemeCategory10[colorIndex];
      })
      .attr('stroke', (d) => (d.isTip ? colors.tipNode : 'none'))
      .attr('stroke-width', (d) => (d.isTip ? 2 : 0))
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (onNodeClick) {
          event.stopPropagation();
          onNodeClick(d.id);
        }
      });

    // Add tooltips
    nodes.append('title').text((d) => {
      return `Node ID: ${d.id}\nCohort: ${d.cohort}\nParents: ${
        d.parents.length > 0 ? d.parents.join(', ') : 'Genesis'
      }\nChildren: ${d.children.length > 0 ? d.children.join(', ') : 'Tip'}\n${
        d.isOnHighWorkPath ? 'On highest work path' : ''
      }`;
    });

    // Add node labels
    g.append('g')
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .attr('x', (d) => nodePositions.get(d.id)?.x || 0)
      .attr('y', (d) => (nodePositions.get(d.id)?.y || 0) + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', 'rgba(255,255,255,0.7)')
      .text((d) => d.id.substring(0, 4));

    // If simulation is running, return a cleanup function
    if (simulationRunning && layoutMode === 'force') {
      return () => {
        console.log('🧹 Cleaning up simulation');
        // Cleanup force simulation if it was running
      };
    }
  }, [
    data,
    width,
    height,
    zoomLevel,
    layoutMode,
    nodePositions,
    onNodeClick,
    simulationRunning,
  ]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: height || 400,
        }}>
        <CircularProgress />
        <Typography variant='body2' sx={{ ml: 2 }}>
          Rendering visualization...
        </Typography>
      </Box>
    );
  }

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: height || 400,
          border: '1px dashed rgba(255,255,255,0.3)',
          borderRadius: 1,
        }}>
        <Typography variant='body1' color='text.secondary'>
          No data available for visualization
        </Typography>
      </Box>
    );
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{
        background: '#121212',
        borderRadius: 4,
      }}
    />
  );
};

export default Renderer;
