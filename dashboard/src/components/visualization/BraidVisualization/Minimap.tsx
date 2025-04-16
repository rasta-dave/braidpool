import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { BraidVisualizationData } from '../../../types/braid';

interface MinimapProps {
  data: BraidVisualizationData | null;
  width: number;
  height: number;
  windowStart: number;
  windowSize: number;
  totalCohorts: number;
}

const Minimap: React.FC<MinimapProps> = ({
  data,
  width,
  height,
  windowStart,
  windowSize,
  totalCohorts,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !data.nodes || data.nodes.length === 0 || !width || !height) {
      return;
    }

    // Create a simplified version of the visualization
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Calculate cohort positions
    const cohortWidth = width / (totalCohorts || 1);

    // Draw cohort indicators
    const cohorts = svg
      .append('g')
      .selectAll('rect')
      .data(data.cohorts)
      .enter()
      .append('rect')
      .attr('x', (_, i) => i * cohortWidth)
      .attr('y', 0)
      .attr('width', cohortWidth)
      .attr('height', height)
      .attr('fill', (_, i) => {
        const colorIndex = i % 10;
        return d3.schemeCategory10[colorIndex];
      })
      .attr('opacity', 0.3);

    // Draw window indicator
    if (totalCohorts > 0) {
      const windowStartX = (windowStart / totalCohorts) * width;
      const windowWidth = (windowSize / totalCohorts) * width;

      svg
        .append('rect')
        .attr('x', windowStartX)
        .attr('y', 0)
        .attr('width', windowWidth)
        .attr('height', height)
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,2');
    }
  }, [data, width, height, windowStart, windowSize, totalCohorts]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{
        background: 'rgba(18, 18, 18, 0.7)',
        borderRadius: 4,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    />
  );
};

export default Minimap;
