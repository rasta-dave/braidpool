// Re-export all visualization components for easier imports

// Main Braid Visualization components
export { default as BraidVisualization } from './BraidVisualization';
export { default as BraidVisualizationOptimized } from './BraidVisualization/BraidVisualizationAdapter';
export { default as StaticBraidVisualization } from '../public/PublicExplorer/visualization/StaticBraidVisualization';

// Sub-components (for direct usage if needed)
export { default as BraidVisualizationRenderer } from './BraidVisualization/Renderer';
export { default as BraidVisualizationControls } from './BraidVisualization/Controls';
export { default as BraidVisualizationStats } from './BraidVisualization/Stats';
export { default as BraidVisualizationMinimap } from './BraidVisualization/Minimap';

// Export the new modular components
export {
  BraidControls,
  BraidNavigator,
  BraidMinimap,
  BraidLegend,
  BraidRenderer,
} from '../public/PublicExplorer/visualization';
