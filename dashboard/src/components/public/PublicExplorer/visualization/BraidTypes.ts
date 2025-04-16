// Type definitions for Braid visualization components

// Node and link interfaces
export interface BraidNode {
  id: number;
  x: number;
  y: number;
}

export interface BraidLink {
  source: number;
  target: number;
}

export interface BraidCohort {
  id: number;
  label: string;
  nodes: number[];
}

// Type for draggable panel positions
export interface PanelPosition {
  x: number;
  y: number;
}

// Type for panel being dragged
export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  panelId: string | null;
}

// Type for transition animation
export interface TransitionState {
  isTransitioning: boolean;
  fromCohort: number;
  toCohort: number;
  progress: number;
}

// Layout options for the visualization
export type LayoutMode = 'braid' | 'grid' | 'force';

// Common props for visualization components
export interface BraidVisualizationBaseProps {
  width?: number;
  height?: number;
  darkMode?: boolean;
}

// Theme colors for the visualization
export interface BraidColorTheme {
  backgroundColor: string;
  textColor: string;
  nodeColors: string[];
  linkColor: string;
  nodeStrokeColor: string;
  tipNodeStrokeColor: string;
  highlightColor: string;
  highWorkPathColor: string;
}

// Direction type for cohort navigation
export type NavigationDirection =
  | 'first'
  | 'last'
  | 'next'
  | 'prev'
  | 'forward'
  | 'back';

// Props for the main cohort navigator component
export interface BraidNavigatorProps extends BraidVisualizationBaseProps {
  currentCohort: number;
  cohorts: BraidCohort[];
  onCohortChange: (cohort: number, animate?: boolean) => void;
  autoScroll: boolean;
  scrollSpeed: number;
  onAutoScrollChange: (enabled: boolean) => void;
  onScrollSpeedChange: (speed: number) => void;
  position: PanelPosition;
  onPositionChange: (position: PanelPosition) => void;
  onDragStart: (e: React.MouseEvent, panelId: string) => void;
  transitionState: TransitionState;
  textColor: string;
  darkMode: boolean;
}

// Props for the renderer component
export interface BraidRendererProps extends BraidVisualizationBaseProps {
  nodes: BraidNode[];
  links: BraidLink[];
  highlightedNodes: number[];
  transitionNodes: number[];
  visibleNodes: number[];
  highWorkPath: number[];
  showHighWorkPath: boolean;
  showDetails: boolean;
  zoomLevel: number;
  colors: BraidColorTheme;
  transitionState: TransitionState;
}

// Props for the controls component
export interface BraidControlsProps extends BraidVisualizationBaseProps {
  showDetails: boolean;
  onShowDetailsChange: (show: boolean) => void;
  showMinimap: boolean;
  onShowMinimapChange: (show: boolean) => void;
  showHighWorkPath: boolean;
  onShowHighWorkPathChange: (show: boolean) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  autoScroll: boolean;
  onAutoScrollChange: (auto: boolean) => void;
  layoutMode: LayoutMode;
  onLayoutChange: (layout: LayoutMode) => void;
  windowSize: number;
  onWindowSizeChange: (size: number) => void;
  position: PanelPosition;
  onPositionChange: (position: PanelPosition) => void;
  onDragStart: (e: React.MouseEvent, panelId: string) => void;
  textColor: string;
  darkMode: boolean;
}

// Props for the minimap component
export interface BraidMinimapProps extends BraidVisualizationBaseProps {
  nodes: BraidNode[];
  links: BraidLink[];
  visibleNodes: number[];
  highWorkPath: number[];
  showHighWorkPath: boolean;
  zoomLevel: number;
  colors: BraidColorTheme;
  viewBoxDimensions: {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  };
}

// Props for the legend component
export interface BraidLegendProps extends BraidVisualizationBaseProps {
  position: PanelPosition;
  onPositionChange: (position: PanelPosition) => void;
  onDragStart: (e: React.MouseEvent, panelId: string) => void;
  showHighWorkPath: boolean;
  textColor: string;
  colors: BraidColorTheme;
  darkMode: boolean;
}
