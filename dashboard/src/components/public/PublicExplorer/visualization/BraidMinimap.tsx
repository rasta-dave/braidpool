import React, { useRef } from 'react';
import { Paper } from '@mui/material';
import { BraidMinimapProps } from './BraidTypes';

/**
 * A minimap component that provides an overview of the braid visualization
 * and shows the current viewport within the larger graph
 */
const BraidMinimap: React.FC<BraidMinimapProps> = ({
  nodes,
  links,
  visibleNodes,
  highWorkPath,
  showHighWorkPath,
  colors,
  viewBoxDimensions,
}) => {
  const minimapRef = useRef<SVGSVGElement>(null);
  const { width, height, offsetX, offsetY } = viewBoxDimensions;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        zIndex: 1000,
        p: 1,
        backgroundColor: (theme) => `rgba(${colors.backgroundColor}, 0.8)`,
        color: colors.textColor,
        borderRadius: 1,
        boxShadow: 3,
        backdropFilter: 'blur(5px)',
        width: 150,
        height: 100,
      }}>
      <svg
        ref={minimapRef}
        width='100%'
        height='100%'
        viewBox='0 0 800 500'
        style={{ background: colors.backgroundColor }}>
        {/* Links */}
        {links.map((link, i) => {
          const source = nodes[link.source];
          const target = nodes[link.target];
          const isHighWorkPathLink =
            highWorkPath.includes(link.source) &&
            highWorkPath.includes(link.target) &&
            highWorkPath.indexOf(link.target) ===
              highWorkPath.indexOf(link.source) + 1;

          return (
            <line
              key={`minimap-link-${i}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={
                isHighWorkPathLink && showHighWorkPath
                  ? colors.highWorkPathColor
                  : colors.linkColor
              }
              strokeWidth={isHighWorkPathLink && showHighWorkPath ? 1.5 : 0.8}
              opacity={0.6}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isHighlighted = visibleNodes.includes(node.id);
          const isOnHighWorkPath =
            highWorkPath.includes(node.id) && showHighWorkPath;

          return (
            <circle
              key={`minimap-node-${node.id}`}
              cx={node.x}
              cy={node.y}
              r={isHighlighted ? 3 : 1.5}
              fill={
                isOnHighWorkPath
                  ? colors.highWorkPathColor
                  : colors.nodeColors[node.id % colors.nodeColors.length]
              }
              opacity={isHighlighted ? 1 : 0.4}
            />
          );
        })}

        {/* Viewport rectangle */}
        <rect
          x={offsetX}
          y={offsetY}
          width={width}
          height={height}
          stroke={colors.textColor}
          strokeWidth={1}
          fill='none'
          strokeDasharray='2,2'
        />
      </svg>
    </Paper>
  );
};

export default BraidMinimap;
