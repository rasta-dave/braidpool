import React from 'react';
import { BraidVisualizationData } from '../../../types/braid';
import BraidVisualization from './index';

/**
 * Adapter component to provide backward compatibility with the previous
 * BraidVisualizationOptimized component. This allows us to refactor the
 * implementation without changing all usages at once.
 */
interface BraidVisualizationOptimizedProps {
  data: BraidVisualizationData | null;
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
}

const BraidVisualizationAdapter: React.FC<BraidVisualizationOptimizedProps> = (
  props
) => {
  console.log('🔄 Using new modular BraidVisualization component');

  // Simply pass all props to the new component
  return <BraidVisualization {...props} />;
};

export default BraidVisualizationAdapter;
