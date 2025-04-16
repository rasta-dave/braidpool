/**
 * OverviewBraidVisualization.tsx
 *
 * This component provides a lightweight, simplified visualization of the Braidpool DAG
 * specifically for the Overview tab. It's deliberately separate from the StaticBraidVisualization
 * component used in the BRAID VISUALIZATION tab to maintain separation of concerns.
 *
 * Key differences:
 * - Pre-computed rendering for better performance in the Overview page
 * - Simplified interface with fewer controls
 * - Only displays a subset of nodes/links for faster rendering
 * - Uses useMemo for optimal re-rendering
 * - No interactive features beyond basic display
 */

import React, { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import {
  mockNetworkStats,
  nodePositions,
  links,
  highWorkPath,
  cohortGroups,
  getDefaultColors,
} from './mock/BraidMockData';

/**
 * A simplified braid visualization for the Overview tab
 * This is completely independent from the StaticBraidVisualization component
 * and only shows a static snapshot with minimal interaction.
 */
const OverviewBraidVisualization: React.FC<{
  height?: number;
  darkMode?: boolean;
}> = ({ height = 400, darkMode = true }) => {
  const colors = getDefaultColors(darkMode);
  const svgHeight = height - 80; // Leave space for stats

  // Pre-compute node positions and colors for better performance
  const { nodeElements, linkElements } = useMemo(() => {
    // Only show a subset of the data for better performance
    const visibleLinks = links.slice(0, 40);
    const visibleNodes = nodePositions.slice(0, 30);

    // Pre-compute link elements
    const linkElements = visibleLinks
      .map((link, i) => {
        const source = nodePositions.find((n) => n.id === link.source);
        const target = nodePositions.find((n) => n.id === link.target);

        if (!source || !target) return null;

        const isHighlighted =
          highWorkPath.includes(link.source) &&
          highWorkPath.includes(link.target);

        return (
          <line
            key={`link-${i}`}
            x1={source.x * 1000}
            y1={source.y * 500}
            x2={target.x * 1000}
            y2={target.y * 500}
            stroke={isHighlighted ? colors.highWorkPathColor : colors.linkColor}
            strokeWidth={isHighlighted ? 2 : 1}
            opacity={isHighlighted ? 0.9 : 0.5}
          />
        );
      })
      .filter(Boolean);

    // Pre-compute node elements
    const nodeElements = visibleNodes.map((node, i) => {
      const isHighlighted = highWorkPath.includes(node.id);
      const radius = isHighlighted ? 8 : 6;

      // Get cohort for color
      const cohortIndex = cohortGroups.findIndex((cohort) =>
        cohort.nodes.includes(node.id)
      );

      // Use the correct properties from BraidColorTheme
      const fillColor = isHighlighted
        ? colors.highWorkPathColor
        : cohortIndex >= 0 && cohortIndex < colors.nodeColors.length
        ? colors.nodeColors[cohortIndex]
        : colors.nodeColors[0]; // Use first color as default

      return (
        <circle
          key={`node-${i}`}
          cx={node.x * 1000}
          cy={node.y * 500}
          r={radius}
          fill={fillColor}
          stroke={colors.nodeStrokeColor}
          strokeWidth={1}
        />
      );
    });

    return { nodeElements, linkElements };
  }, [colors]); // Only recompute when colors change (dark mode toggle)

  // Print the number of elements we're rendering for debugging
  console.log(
    `🔍 Rendering Overview Braid: ${linkElements.length} links, ${nodeElements.length} nodes`
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={1}
        sx={{
          height: height,
          overflow: 'hidden',
          borderRadius: 1,
          backgroundColor: darkMode
            ? 'rgba(30, 30, 30, 0.8)'
            : 'rgba(245, 245, 245, 0.8)',
        }}>
        {/* SVG Visualization - Simple version */}
        <Box sx={{ height: svgHeight, p: 1 }}>
          <svg
            width='100%'
            height='100%'
            viewBox='0 0 1000 500'
            preserveAspectRatio='xMidYMid meet'>
            {/* Background */}
            <rect
              x='0'
              y='0'
              width='1000'
              height='500'
              fill={darkMode ? '#1a1a1a' : '#f5f5f5'}
            />

            {/* Render pre-computed elements */}
            <g>{linkElements}</g>
            <g>{nodeElements}</g>

            {/* Overview Text */}
            <text x='20' y='30' fill={colors.textColor} fontSize='14'>
              Braidpool DAG Structure (Simplified View)
            </text>
          </svg>
        </Box>

        {/* Stats at bottom */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${
              darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }`,
            display: 'flex',
            justifyContent: 'space-between',
          }}>
          <Typography
            variant='body2'
            color={darkMode ? 'white' : 'text.primary'}>
            <strong>Nodes:</strong> {mockNetworkStats.nodeCount}
          </Typography>

          <Typography
            variant='body2'
            color={darkMode ? 'white' : 'text.primary'}>
            <strong>Connections:</strong> {mockNetworkStats.linkCount}
          </Typography>

          <Typography
            variant='body2'
            color={darkMode ? 'white' : 'text.primary'}>
            <strong>Cohorts:</strong> {mockNetworkStats.cohortCount}
          </Typography>

          <Typography
            variant='body2'
            color={darkMode ? 'white' : 'text.primary'}>
            <strong>Tips:</strong> {mockNetworkStats.tipCount}
          </Typography>
        </Box>
      </Paper>

      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ mt: 1, fontSize: '0.8rem', textAlign: 'center' }}>
        View the <strong>Braid Visualization</strong> tab for a fully
        interactive experience
      </Typography>
    </Box>
  );
};

export default OverviewBraidVisualization;
