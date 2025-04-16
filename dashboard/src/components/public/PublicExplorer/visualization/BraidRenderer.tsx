import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { BraidRendererProps, TransitionState } from './BraidTypes';

/**
 * A component that renders the SVG visualization of the braid structure
 */
const BraidRenderer: React.FC<BraidRendererProps> = ({
  nodes,
  links,
  highlightedNodes,
  transitionNodes,
  visibleNodes,
  highWorkPath,
  showHighWorkPath,
  showDetails,
  zoomLevel,
  colors,
  transitionState,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate scaled dimensions
  const scale = zoomLevel / 100;
  const width = 800;
  const height = 500;
  const viewBoxWidth = width / scale;
  const viewBoxHeight = height / scale;
  const viewBoxOffsetX = (width - viewBoxWidth) / 2;
  const viewBoxOffsetY = (height - viewBoxHeight) / 2;

  // Function to calculate node opacity during transitions
  const getNodeOpacity = (nodeId: number) => {
    if (!transitionState.isTransitioning) {
      const isVisible = visibleNodes.includes(nodeId);
      return isVisible ? 1 : 0.3;
    }

    // During transition, mix the highlighting between cohorts
    if (transitionNodes.includes(nodeId)) {
      return 1;
    } else {
      return 0.3;
    }
  };

  return (
    <Box>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`${viewBoxOffsetX} ${viewBoxOffsetY} ${viewBoxWidth} ${viewBoxHeight}`}
        style={{
          backgroundColor: colors.backgroundColor,
          borderRadius: 6,
          maxWidth: '100%',
          boxShadow: 'rgb(255 255 255 / 8%) 0px 0px 0px 1px inset',
        }}>
        {/* Links */}
        <g>
          {links.map((link, index) => {
            const source = nodes[link.source];
            const target = nodes[link.target];
            const isHighWorkPathLink =
              highWorkPath.includes(link.source) &&
              highWorkPath.includes(link.target) &&
              highWorkPath.indexOf(link.target) ===
                highWorkPath.indexOf(link.source) + 1;

            return (
              <path
                key={`link-${index}`}
                d={`M${source.x},${source.y} L${target.x},${target.y}`}
                fill='none'
                stroke={
                  isHighWorkPathLink && showHighWorkPath
                    ? colors.highWorkPathColor
                    : colors.linkColor
                }
                strokeWidth={isHighWorkPathLink && showHighWorkPath ? 2.5 : 1.5}
                strokeOpacity={
                  isHighWorkPathLink && showHighWorkPath ? 0.8 : 0.6
                }
                markerEnd='url(#arrow)'
              />
            );
          })}
        </g>

        {/* Arrow definition */}
        <defs>
          <marker
            id='arrow'
            viewBox='0 -5 10 10'
            refX='20'
            refY='0'
            markerWidth='6'
            markerHeight='6'
            orient='auto'>
            <path d='M0,-5L10,0L0,5' fill={colors.linkColor}></path>
          </marker>
        </defs>

        {/* Nodes */}
        <g>
          {nodes.map((node) => {
            const isHighlighted = highlightedNodes.includes(node.id);
            const isInTransition = transitionNodes.includes(node.id);
            const isTip = node.id === 29; // Last node is tip node
            const isOnHighWorkPath =
              highWorkPath.includes(node.id) && showHighWorkPath;

            // Calculate node opacity based on transition state
            const nodeOpacity = getNodeOpacity(node.id);

            // Highlight color with transition effect
            const highlightStrokeColor = isHighlighted
              ? transitionState.isTransitioning
                ? `rgba(255, 215, 0, ${Math.min(
                    1,
                    transitionState.progress * 2
                  )})`
                : colors.highlightColor
              : isTip
              ? colors.tipNodeStrokeColor
              : colors.nodeStrokeColor;

            return (
              <circle
                key={`node-${node.id}`}
                r={isTip ? 10 : isInTransition ? 9 : 8}
                cx={node.x}
                cy={node.y}
                fill={
                  isOnHighWorkPath
                    ? colors.highWorkPathColor
                    : colors.nodeColors[node.id % colors.nodeColors.length]
                }
                stroke={highlightStrokeColor}
                strokeWidth={
                  isHighlighted || isInTransition ? 2.5 : isTip ? 2.5 : 1.5
                }
                opacity={nodeOpacity}
              />
            );
          })}
        </g>

        {/* Node labels */}
        {showDetails && (
          <g>
            {nodes.map((node) => {
              const nodeOpacity = getNodeOpacity(node.id);

              return (
                <text
                  key={`label-${node.id}`}
                  x={node.x}
                  y={node.y}
                  dy='.35em'
                  textAnchor='middle'
                  style={{
                    fill: colors.textColor,
                    fontSize: '10px',
                    pointerEvents: 'none',
                    fontWeight: highlightedNodes.includes(node.id)
                      ? 'bold'
                      : 'normal',
                    opacity: nodeOpacity,
                  }}>
                  {node.id}
                </text>
              );
            })}
          </g>
        )}

        {/* Title */}
        <text
          x='386'
          y='30'
          textAnchor='middle'
          style={{
            fill: colors.textColor,
            fontSize: '20px',
            fontWeight: 'bold',
          }}>
          Braid Visualization
        </text>
      </svg>
    </Box>
  );
};

export default BraidRenderer;
