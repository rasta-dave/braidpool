import React from 'react';
import { BraidVisualizationData } from '../types/braid';
import { BraidVisualizationOptimized as ModularBraidVisualization } from './visualization';
import { normalizeVisualizationData } from '../utils/dataNormalizer';

/**
 * This is a proxy component that maintains backward compatibility
 * with existing usage while delegating to our new modular implementation.
 *
 * Note: The original 1900+ lines of code have been refactored into smaller
 * modular components in the visualization directory.
 */
interface BraidVisualizationOptimizedProps {
  data: BraidVisualizationData | null;
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
}

const BraidVisualizationOptimized: React.FC<
  BraidVisualizationOptimizedProps
> = (props) => {
  console.log('🔄 Using refactored BraidVisualization implementation');

  // Normalize data before passing to the implementation
  const normalizedData = props.data
    ? normalizeVisualizationData(props.data)
    : null;

  return <ModularBraidVisualization {...props} data={normalizedData} />;
};

export default BraidVisualizationOptimized;
