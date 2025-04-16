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

import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip, Stack, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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
  const [highlightPath, setHighlightPath] = useState<boolean>(true);
  const [ready, setReady] = useState<boolean>(false);

  // Calculate dimensions to better fit an overview context
  const svgHeight = height - 50; // More space for visualization, smaller stats section
  const borderRadius = 2; // Slightly more rounded for a modern look

  // Add small animation effect on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
      console.log('🎬 Visualization ready!');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Sample key statistics for easy reference
  const keyStats = {
    nodes: mockNetworkStats.nodeCount,
    connections: mockNetworkStats.linkCount,
    cohorts: mockNetworkStats.cohortCount,
    tips: mockNetworkStats.tipCount,
  };

  // Pre-compute node positions and colors for better performance
  const { nodeElements, linkElements, pathElements } = useMemo(() => {
    // Get min/max coordinates to ensure proper scaling
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    nodePositions.forEach((node) => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    });

    const padding = 50; // Padding around visualization
    const width = 1000 - padding * 2;
    const height = 500 - padding * 2;

    // Function to scale coordinates to fit the viewport with padding
    const scaleX = (x: number) =>
      padding + ((x - minX) / (maxX - minX)) * width;
    const scaleY = (y: number) =>
      padding + ((y - minY) / (maxY - minY)) * height;

    // Show more nodes for clearer visualization in overview
    const visibleLinks = links.slice(0, 50);
    const visibleNodes = nodePositions.slice(0, 40);

    // Pre-compute link elements - draw regular links first
    const regularLinks = visibleLinks
      .filter(
        (link) =>
          !highWorkPath.includes(link.source) ||
          !highWorkPath.includes(link.target)
      )
      .map((link, i) => {
        const source = nodePositions.find((n) => n.id === link.source);
        const target = nodePositions.find((n) => n.id === link.target);

        if (!source || !target) return null;

        return (
          <line
            key={`link-${i}`}
            x1={scaleX(source.x)}
            y1={scaleY(source.y)}
            x2={scaleX(target.x)}
            y2={scaleY(target.y)}
            stroke={colors.linkColor}
            strokeWidth={1}
            opacity={0.4}
          />
        );
      })
      .filter(Boolean);

    // Pre-compute high-work path links separately
    const pathLinks = visibleLinks
      .filter(
        (link) =>
          highWorkPath.includes(link.source) &&
          highWorkPath.includes(link.target)
      )
      .map((link, i) => {
        const source = nodePositions.find((n) => n.id === link.source);
        const target = nodePositions.find((n) => n.id === link.target);

        if (!source || !target) return null;

        return (
          <line
            key={`path-link-${i}`}
            x1={scaleX(source.x)}
            y1={scaleY(source.y)}
            x2={scaleX(target.x)}
            y2={scaleY(target.y)}
            stroke={colors.highWorkPathColor}
            strokeWidth={2.5}
            opacity={0.85}
          />
        );
      })
      .filter(Boolean);

    // Pre-compute regular node elements
    const regularNodes = visibleNodes
      .filter((node) => !highWorkPath.includes(node.id))
      .map((node, i) => {
        // Get cohort for color
        const cohortIndex = cohortGroups.findIndex((cohort) =>
          cohort.nodes.includes(node.id)
        );

        // Use the correct properties from BraidColorTheme
        const fillColor =
          cohortIndex >= 0 && cohortIndex < colors.nodeColors.length
            ? colors.nodeColors[cohortIndex]
            : colors.nodeColors[0];

        return (
          <circle
            key={`node-${i}`}
            cx={scaleX(node.x)}
            cy={scaleY(node.y)}
            r={5}
            fill={fillColor}
            stroke={colors.nodeStrokeColor}
            strokeWidth={0.5}
            opacity={0.8}
          />
        );
      });

    // Pre-compute high-work path node elements
    const pathNodes = visibleNodes
      .filter((node) => highWorkPath.includes(node.id))
      .map((node, i) => {
        return (
          <circle
            key={`path-node-${i}`}
            cx={scaleX(node.x)}
            cy={scaleY(node.y)}
            r={7}
            fill={colors.highWorkPathColor}
            stroke={colors.nodeStrokeColor}
            strokeWidth={1}
            opacity={0.9}
          />
        );
      });

    // Print out bounding info for debugging
    console.log(`📊 DAG bounds: X(${minX}-${maxX}), Y(${minY}-${maxY})`);
    console.log(
      `🎯 First node rendered at: (${scaleX(visibleNodes[0].x)}, ${scaleY(
        visibleNodes[0].y
      )})`
    );

    return {
      nodeElements: regularNodes,
      linkElements: regularLinks,
      pathElements: { links: pathLinks, nodes: pathNodes },
    };
  }, [colors]); // Only recompute when colors change (dark mode toggle)

  // Print the number of elements we're rendering for debugging
  console.log(
    `🔍 Rendering Overview Braid: ${linkElements.length} links, ${nodeElements.length} nodes`
  );

  const toggleHighlightPath = () => {
    setHighlightPath(!highlightPath);
  };

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <Paper
        elevation={2}
        sx={{
          height: height,
          overflow: 'hidden',
          borderRadius,
          backgroundColor: darkMode
            ? 'rgba(25, 25, 30, 0.85)'
            : 'rgba(250, 250, 250, 0.9)',
          backdropFilter: 'blur(4px)',
          position: 'relative',
        }}>
        {/* SVG Visualization - Optimized for overview */}
        <Box sx={{ height: svgHeight, p: 1, position: 'relative' }}>
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
              fill={darkMode ? '#1a1a1a' : '#f8f8f8'}
              rx={8}
            />

            {/* Render pre-computed elements with a simple opacity animation */}
            <g
              opacity={ready ? '1' : '0'}
              style={{ transition: 'opacity 0.3s ease-in' }}>
              <g>{linkElements}</g>
              {highlightPath && (
                <>
                  <g>{pathElements.links}</g>
                  <g>{pathElements.nodes}</g>
                </>
              )}
              <g>{nodeElements}</g>
            </g>

            {/* Overview Labels */}
            <text
              x='20'
              y='30'
              fill={colors.textColor}
              fontSize='14'
              fontWeight='500'>
              Braidpool DAG Visualization
            </text>
            {highlightPath && (
              <text x='20' y='55' fill={colors.highWorkPathColor} fontSize='12'>
                High-Work Path Highlighted
              </text>
            )}
          </svg>

          {/* Overlay button to toggle path highlight */}
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 2,
            }}>
            <Button
              size='small'
              variant='text'
              onClick={toggleHighlightPath}
              sx={{
                color: highlightPath
                  ? colors.highWorkPathColor
                  : colors.textColor,
                backgroundColor: darkMode
                  ? 'rgba(0,0,0,0.3)'
                  : 'rgba(255,255,255,0.5)',
                fontSize: '0.75rem',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: darkMode
                    ? 'rgba(0,0,0,0.5)'
                    : 'rgba(255,255,255,0.7)',
                },
              }}>
              {highlightPath ? 'Hide Path' : 'Show High-Work Path'}
            </Button>
          </Box>
        </Box>

        {/* Compact Stats at bottom */}
        <Stack
          direction='row'
          spacing={2}
          justifyContent='space-between'
          alignItems='center'
          sx={{
            px: 2,
            py: 1,
            borderTop: `1px solid ${
              darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
            }`,
            backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.01)',
          }}>
          {/* Left side: network stats */}
          <Stack direction='row' spacing={1.5} flexWrap='wrap'>
            <Chip
              size='small'
              variant='outlined'
              label={`${keyStats.nodes} Beads`}
              sx={{
                color: darkMode ? 'white' : 'text.primary',
                borderColor: darkMode
                  ? 'rgba(255,255,255,0.2)'
                  : 'rgba(0,0,0,0.2)',
              }}
            />
            <Chip
              size='small'
              variant='outlined'
              label={`${keyStats.connections} Links`}
              sx={{
                color: darkMode ? 'white' : 'text.primary',
                borderColor: darkMode
                  ? 'rgba(255,255,255,0.2)'
                  : 'rgba(0,0,0,0.2)',
              }}
            />
            <Chip
              size='small'
              variant='outlined'
              label={`${keyStats.cohorts} Cohorts`}
              sx={{
                color: darkMode ? 'white' : 'text.primary',
                borderColor: darkMode
                  ? 'rgba(255,255,255,0.2)'
                  : 'rgba(0,0,0,0.2)',
              }}
            />
          </Stack>

          {/* Right side: full view link */}
          <Button
            size='small'
            endIcon={<ArrowForwardIcon fontSize='small' />}
            variant='text'
            component='a'
            href='#braid-visualization'
            sx={{
              color: darkMode ? 'white' : 'text.primary',
              fontSize: '0.8rem',
              '&:hover': {
                backgroundColor: darkMode
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.05)',
              },
            }}>
            Full Visualization
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default OverviewBraidVisualization;
