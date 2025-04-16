import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import {
  BraidVisualizationBaseProps,
  PanelPosition,
  DragState,
  TransitionState,
  BraidColorTheme,
  LayoutMode,
  BraidCohort,
} from './BraidTypes';
import BraidControls from './BraidControls';
import BraidNavigator from './BraidNavigator';
import BraidMinimap from './BraidMinimap';
import BraidLegend from './BraidLegend';
import BraidRenderer from './BraidRenderer';
import {
  cohortGroups,
  highWorkPath,
  nodePositions,
  links,
  getDefaultColors,
} from '../mock/BraidMockData';

/**
 * A static, reliable braid visualization component with interactive features
 *
 * This component renders a pre-defined DAG structure that represents
 * the braid concept without requiring complex data transformations.
 */
const StaticBraidVisualization: React.FC<BraidVisualizationBaseProps> = ({
  width = 800,
  height = 500,
  darkMode = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Basic visualization state
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [currentCohort, setCurrentCohort] = useState<number>(0);
  const [highlightedNodes, setHighlightedNodes] = useState<number[]>([0, 1, 2]);
  const [autoScroll, setAutoScroll] = useState<boolean>(false);

  // Enhanced visualization features
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [showHighWorkPath, setShowHighWorkPath] = useState<boolean>(true);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('braid');
  const [windowSize, setWindowSize] = useState<number>(3);

  // Cohort scrolling features
  const [scrollSpeed, setScrollSpeed] = useState<number>(2); // seconds
  const [transitionState, setTransitionState] = useState<TransitionState>({
    isTransitioning: false,
    fromCohort: 0,
    toCohort: 0,
    progress: 0,
  });
  const transitionRef = useRef<NodeJS.Timeout | null>(null);
  const [cohortHistory, setCohortHistory] = useState<number[]>([0]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Panel position state with improved default positions
  const [controlsPosition, setControlsPosition] = useState<PanelPosition>({
    x: width - 280,
    y: 10,
  });
  const [navigationPosition, setNavigationPosition] = useState<PanelPosition>({
    x: 10,
    y: 10,
  });
  const [legendPosition, setLegendPosition] = useState<PanelPosition>({
    x: width - 280,
    y: height - 160,
  });

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    panelId: null,
  });

  // Auto-scroll timer
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // Theme colors
  const colors: BraidColorTheme = getDefaultColors(darkMode);

  // Calculate scaled dimensions for the viewBox
  const scale = zoomLevel / 100;
  const scaledWidth = width;
  const scaledHeight = height;
  const viewBoxWidth = width / scale;
  const viewBoxHeight = height / scale;
  const viewBoxOffsetX = (width - viewBoxWidth) / 2;
  const viewBoxOffsetY = (height - viewBoxHeight) / 2;

  // Calculate visible cohorts based on windowSize
  const visibleCohorts = (() => {
    const start = Math.max(0, currentCohort - Math.floor(windowSize / 2));
    const end = Math.min(cohortGroups.length, start + windowSize);
    return cohortGroups.slice(start, end);
  })();

  // Calculate all visible nodes from visible cohorts
  const visibleNodeIds = (() => {
    const nodeSet = new Set<number>();
    visibleCohorts.forEach((cohort: BraidCohort) => {
      cohort.nodes.forEach((node: number) => nodeSet.add(node));
    });
    return Array.from(nodeSet);
  })();

  // Handle cohort navigation with animation
  const handleCohortChange = (newCohort: number, animate: boolean = true) => {
    if (newCohort >= 0 && newCohort < cohortGroups.length) {
      if (animate && newCohort !== currentCohort) {
        // Start transition animation
        setTransitionState({
          isTransitioning: true,
          fromCohort: currentCohort,
          toCohort: newCohort,
          progress: 0,
        });

        // Clear any existing transition
        if (transitionRef.current) {
          clearInterval(transitionRef.current);
        }

        // Set up transition animation
        let progress = 0;
        const step = 0.05; // 20 steps for smooth transition

        transitionRef.current = setInterval(() => {
          progress += step;
          if (progress >= 1) {
            // Finish transition
            setTransitionState((prev) => ({
              ...prev,
              isTransitioning: false,
              progress: 1,
            }));
            setCurrentCohort(newCohort);
            setHighlightedNodes(cohortGroups[newCohort].nodes);

            // Add to history if it's a new navigation (not from history controls)
            if (!cohortHistory.includes(newCohort)) {
              setCohortHistory((prev) => [...prev, newCohort]);
              setHistoryIndex(cohortHistory.length);
            }

            // Clear interval
            if (transitionRef.current) {
              clearInterval(transitionRef.current);
              transitionRef.current = null;
            }

            console.log(
              `🔍 Viewed cohort ${newCohort}: ${cohortGroups[newCohort].label}`
            );
          } else {
            // Update transition progress
            setTransitionState((prev) => ({ ...prev, progress }));
          }
        }, 30); // ~30fps for smooth animation
      } else {
        // Immediate change without animation
        setCurrentCohort(newCohort);
        setHighlightedNodes(cohortGroups[newCohort].nodes);

        // Add to history
        if (!cohortHistory.includes(newCohort)) {
          setCohortHistory((prev) => [...prev, newCohort]);
          setHistoryIndex(cohortHistory.length);
        }

        console.log(
          `🔍 Viewing cohort ${newCohort}: ${cohortGroups[newCohort].label}`
        );
      }
    }
  };

  // Auto-scrolling through cohorts
  useEffect(() => {
    if (autoScroll) {
      console.log(
        `🔄 Auto-scrolling cohorts enabled (${scrollSpeed}s interval)`
      );
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
      autoScrollRef.current = setInterval(() => {
        const nextCohort = (currentCohort + 1) % cohortGroups.length;
        handleCohortChange(nextCohort);
      }, scrollSpeed * 1000);
    } else {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [autoScroll, scrollSpeed, currentCohort]);

  // Clean up transition animation on unmount
  useEffect(() => {
    return () => {
      if (transitionRef.current) {
        clearInterval(transitionRef.current);
      }
    };
  }, []);

  // Drag handlers for panels
  const handleMouseDown = (e: React.MouseEvent, panelId: string) => {
    e.preventDefault();
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      panelId,
    });
    console.log(`🖱️ Started dragging ${panelId} panel`);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging) return;

    e.preventDefault();
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    // Update the position based on which panel is being dragged
    if (dragState.panelId === 'controls') {
      setControlsPosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
    } else if (dragState.panelId === 'navigation') {
      setNavigationPosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
    } else if (dragState.panelId === 'legend') {
      setLegendPosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
    }

    // Update drag start position
    setDragState((prev) => ({
      ...prev,
      startX: e.clientX,
      startY: e.clientY,
    }));
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      console.log(`✋ Stopped dragging ${dragState.panelId} panel`);
      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        panelId: null,
      });
    }
  };

  // Calculate transition-adjusted highlighted nodes
  const getTransitionHighlightedNodes = () => {
    if (!transitionState.isTransitioning || transitionState.progress >= 1) {
      return highlightedNodes;
    }

    // During transition, gradually change the highlight intensity based on progress
    return [
      ...new Set([
        ...cohortGroups[transitionState.fromCohort].nodes,
        ...cohortGroups[transitionState.toCohort].nodes,
      ]),
    ];
  };

  const transitionNodes = getTransitionHighlightedNodes();

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            width: '100%',
            height: `${height}px`,
            overflow: 'hidden',
            borderRadius: 1,
            boxShadow: 2,
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}>
          {/* Main SVG Renderer centered in the view */}
          <BraidRenderer
            nodes={nodePositions}
            links={links}
            highlightedNodes={highlightedNodes}
            transitionNodes={transitionNodes}
            visibleNodes={visibleNodeIds}
            highWorkPath={highWorkPath}
            showHighWorkPath={showHighWorkPath}
            showDetails={showDetails}
            zoomLevel={zoomLevel}
            colors={colors}
            transitionState={transitionState}
            width={width}
            height={height}
            darkMode={darkMode}
          />

          {/* Controls panel in top right */}
          <BraidControls
            showDetails={showDetails}
            onShowDetailsChange={setShowDetails}
            showMinimap={showMinimap}
            onShowMinimapChange={setShowMinimap}
            showHighWorkPath={showHighWorkPath}
            onShowHighWorkPathChange={setShowHighWorkPath}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            autoScroll={autoScroll}
            onAutoScrollChange={setAutoScroll}
            layoutMode={layoutMode}
            onLayoutChange={setLayoutMode}
            windowSize={windowSize}
            onWindowSizeChange={setWindowSize}
            position={controlsPosition}
            onPositionChange={setControlsPosition}
            onDragStart={handleMouseDown}
            textColor={colors.textColor}
            darkMode={darkMode}
          />

          {/* Cohort Navigation panel in top left */}
          <BraidNavigator
            currentCohort={currentCohort}
            cohorts={cohortGroups}
            onCohortChange={handleCohortChange}
            autoScroll={autoScroll}
            scrollSpeed={scrollSpeed}
            onAutoScrollChange={setAutoScroll}
            onScrollSpeedChange={setScrollSpeed}
            position={navigationPosition}
            onPositionChange={setNavigationPosition}
            onDragStart={handleMouseDown}
            transitionState={transitionState}
            textColor={colors.textColor}
            darkMode={darkMode}
          />

          {/* Legend panel, only shown when details are enabled */}
          {showDetails && (
            <BraidLegend
              position={legendPosition}
              onPositionChange={setLegendPosition}
              onDragStart={handleMouseDown}
              showHighWorkPath={showHighWorkPath}
              textColor={colors.textColor}
              colors={colors}
              darkMode={darkMode}
            />
          )}

          {/* Minimap, only shown when enabled */}
          {showMinimap && (
            <BraidMinimap
              nodes={nodePositions}
              links={links}
              visibleNodes={visibleNodeIds}
              highWorkPath={highWorkPath}
              showHighWorkPath={showHighWorkPath}
              zoomLevel={zoomLevel}
              colors={colors}
              viewBoxDimensions={{
                width: viewBoxWidth,
                height: viewBoxHeight,
                offsetX: viewBoxOffsetX,
                offsetY: viewBoxOffsetY,
              }}
            />
          )}
        </Box>
      </Grid>

      {/* Additional information in a separate section below */}
      {showDetails && (
        <Grid item xs={12}>
          <Paper
            elevation={1}
            sx={{
              mt: 2,
              p: 3,
              bgcolor: darkMode
                ? 'rgba(30, 30, 30, 0.8)'
                : 'rgba(245, 245, 245, 0.8)',
              borderRadius: 1,
            }}>
            <Typography
              variant='subtitle1'
              color={colors.textColor}
              gutterBottom>
              <strong>Visualization Details</strong>
            </Typography>
            <Typography variant='body2' color={colors.textColor}>
              This diagram shows a Directed Acyclic Graph (DAG) structure used
              by Braidpool. Nodes represent mined shares ("beads"), and arrows
              show their relationships. Colors indicate different cohorts in the
              network.
            </Typography>
            <Typography variant='body2' color={colors.textColor} sx={{ mt: 2 }}>
              <strong>Node Count:</strong> {nodePositions.length} |{' '}
              <strong>Connection Count:</strong> {links.length} |{' '}
              <strong>Cohort Count:</strong> {cohortGroups.length} |{' '}
              <strong>Current Cohort:</strong>{' '}
              {cohortGroups[currentCohort].label} |{' '}
              <strong>Window Size:</strong> {windowSize} cohorts |{' '}
              <strong>Layout:</strong> {layoutMode}
              {transitionState.isTransitioning && (
                <span>
                  {' '}
                  | <strong>Transitioning:</strong>{' '}
                  {Math.round(transitionState.progress * 100)}%
                </span>
              )}
            </Typography>
            <Typography variant='body2' color={colors.textColor} sx={{ mt: 2 }}>
              <strong>Tip:</strong> All control panels can be dragged and
              repositioned by their drag handles. Use the cohort navigation
              controls to explore the DAG.
            </Typography>
            {showHighWorkPath && (
              <Typography
                variant='body2'
                color={colors.textColor}
                sx={{ mt: 2 }}>
                <strong>Highest Work Path:</strong> The path highlighted in{' '}
                {colors.highWorkPathColor} represents the chain with the highest
                cumulative work, which would be the main chain in Bitcoin.
              </Typography>
            )}
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default StaticBraidVisualization;
