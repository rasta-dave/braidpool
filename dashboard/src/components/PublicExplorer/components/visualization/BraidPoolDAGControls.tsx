import React, { useState, useRef, useEffect } from 'react';
import { ConnectivityType } from './ConnectivityUtils';
import { EdgeType } from './EdgeUtils';

interface BraidPoolDAGControlsProps {
  showHWPOnly: boolean;
  setShowHWPOnly: (show: boolean) => void;
  highlightOrphans: boolean;
  setHighlightOrphans: (highlight: boolean) => void;
  colorMode: 'cohort' | 'value';
  setColorMode: (mode: 'cohort' | 'value') => void;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  selectedCohorts: number | 'all';
  setSelectedCohorts: (cohorts: number | 'all') => void;
  connectivityFilter: ConnectivityType;
  setConnectivityFilter: (type: ConnectivityType) => void;
  edgeFilter: EdgeType;
  setEdgeFilter: (type: EdgeType) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  nodeSpacing?: number;
  setNodeSpacing?: (spacing: number) => void;
  enableDragging?: boolean;
  setEnableDragging?: (enable: boolean) => void;
  verticalSpacing?: number;
  setVerticalSpacing?: (spacing: number) => void;
  connectivityStats?: {
    orphans: number;
    roots: number;
    junctions: number;
    highDegree: number;
    bridges: number;
    total: number;
  };
  edgeStats?: {
    intraCohort: number;
    crossCohort: number;
    hwp: number;
    bridge: number;
    total: number;
  };
}

const BraidPoolDAGControls: React.FC<BraidPoolDAGControlsProps> = ({
  showHWPOnly,
  setShowHWPOnly,
  highlightOrphans,
  setHighlightOrphans,
  colorMode,
  setColorMode,
  paused,
  setPaused,
  animationSpeed,
  setAnimationSpeed,
  selectedCohorts,
  setSelectedCohorts,
  connectivityFilter,
  setConnectivityFilter,
  edgeFilter,
  setEdgeFilter,
  searchTerm = '',
  setSearchTerm = () => {},
  nodeSpacing = 80,
  setNodeSpacing = () => {},
  verticalSpacing = 60,
  setVerticalSpacing = () => {},
  enableDragging = false,
  setEnableDragging = () => {},
  connectivityStats = {
    orphans: 0,
    roots: 0,
    junctions: 0,
    highDegree: 0,
    bridges: 0,
    total: 0,
  },
  edgeStats = {
    intraCohort: 0,
    crossCohort: 0,
    hwp: 0,
    bridge: 0,
    total: 0,
  },
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showColorLegend, setShowColorLegend] = useState(false);

  // Add tooltip state
  const [tooltip, setTooltip] = useState({
    show: false,
    text: '',
    x: 0,
    y: 0,
  });

  // State for draggable color legend
  const [legendPosition, setLegendPosition] = useState({ x: 250, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const legendRef = useRef<HTMLDivElement>(null);

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (legendRef.current) {
      const rect = legendRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  // Effect for global mouse move/up events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setLegendPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Array of cohort colors used in the visualization
  const cohortColors = [
    { color: 'rgba(217, 95, 2, 1)', label: 'Cohort 1 - Most recent group' },
    {
      color: 'rgba(117, 112, 179, 1)',
      label: 'Cohort 2 - Second recent group',
    },
    { color: 'rgba(102, 166, 30, 1)', label: 'Cohort 3 - Third recent group' },
    { color: 'rgba(231, 41, 138, 1)', label: 'Cohort 4 - Fourth recent group' },
  ];

  // Simplified value colors - using a single continuous scale (Viridis)
  const valueColors = [
    { value: 0.0, color: '#440154', label: 'Lowest' },
    { value: 0.2, color: '#404388', label: 'Low' },
    { value: 0.4, color: '#29788E', label: 'Medium-Low' },
    { value: 0.6, color: '#22A884', label: 'Medium-High' },
    { value: 0.8, color: '#7AD151', label: 'High' },
    { value: 1.0, color: '#FDE725', label: 'Highest (HWP)' },
  ];

  // Function to position tooltip properly to stay within screen
  const positionTooltip = (x: number, y: number, width: number = 300) => {
    // Get window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Adjust x position to keep tooltip on screen
    let adjustedX = x;
    if (adjustedX + width > windowWidth - 20) {
      adjustedX = windowWidth - width - 20;
    }

    // Adjust y position (prioritize showing below element, but show above if not enough space)
    let adjustedY = y + 25;
    const estimatedHeight = 150; // Estimate tooltip height

    if (adjustedY + estimatedHeight > windowHeight - 20) {
      adjustedY = y - estimatedHeight - 10;
    }

    return { x: adjustedX, y: adjustedY };
  };

  // Create helper function to show tooltip
  const showTooltipFor = (section: string, event: React.MouseEvent) => {
    let tooltipText = '';

    switch (section) {
      case 'search':
        tooltipText = `
          <strong>Search Node</strong><br/>
          Find specific nodes in the graph by ID or hash value. When a node is found:
          <ul>
            <li>The matching node will be highlighted</li>
            <li>All connecting paths to and from the node will be shown</li>
            <li>Other nodes and paths will be dimmed</li>
          </ul>
          Use this to trace the path of specific nodes or analyze their connections.
        `;
        break;
      case 'layout':
        tooltipText = `
          <strong>Layout Controls</strong><br/>
          Adjust how nodes are arranged in the visualization:
          <ul>
            <li><strong>Horizontal Spacing:</strong> Controls distance between nodes in columns</li>
            <li><strong>Vertical Spacing:</strong> Controls distance between stacked nodes</li>
            <li><strong>Enable Node Dragging:</strong> Lets you click and drag nodes to custom positions</li>
          </ul>
          Use these controls to better organize complex graphs or focus on specific areas.
        `;
        break;
      case 'connectivity':
        tooltipText = `
          <strong>Connectivity Filter</strong><br/>
          Filter nodes based on their network connections:
          <ul>
            <li><strong>All Nodes:</strong> Shows the complete network</li>
            <li><strong>Orphans:</strong> Nodes with no children (endpoints)</li>
            <li><strong>Roots:</strong> Nodes with no parents (starting points)</li>
            <li><strong>Junctions:</strong> Nodes with multiple parents and children (high connectivity)</li>
            <li><strong>High-Degree:</strong> Nodes with many total connections</li>
            <li><strong>Bridges:</strong> Nodes that connect different cohorts</li>
          </ul>
          Use this filter to analyze network topology and identify key nodes.
        `;
        break;
      case 'edge':
        tooltipText = `
          <strong>Edge Type Filter</strong><br/>
          Filter connections between nodes based on their relationship:
          <ul>
            <li><strong>All Connections:</strong> Shows all edges</li>
            <li><strong>Within Same Cohort:</strong> Connections between nodes in the same timeframe</li>
            <li><strong>Between Different Cohorts:</strong> Connections across different timeframes</li>
            <li><strong>Highest Work Path:</strong> Connections along the main consensus path</li>
            <li><strong>Bridge Connections:</strong> Key edges that connect different parts of the network</li>
          </ul>
          Use this to analyze how information flows through the network.
        `;
        break;
      case 'filter':
        tooltipText = `
          <strong>Filter Nodes</strong><br/>
          Control which nodes are visible in the graph:
          <ul>
            <li><strong>Cohorts:</strong> Show only the selected number of most recent cohorts</li>
            <li><strong>Highest Work Path Only:</strong> Show only nodes on the main consensus path</li>
            <li><strong>Highlight Orphans:</strong> Visually highlight nodes without children</li>
          </ul>
          These filters help simplify complex graphs and focus on specific aspects of the network.
        `;
        break;
      default:
        tooltipText = '';
    }

    if (tooltipText) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const position = positionTooltip(bounds.left, bounds.bottom);

      setTooltip({
        show: true,
        text: tooltipText,
        x: position.x,
        y: position.y,
      });
    }
  };

  // Hide tooltip function
  const hideTooltip = () => {
    setTooltip({ ...tooltip, show: false });
  };

  // Create tooltip component
  const TooltipComponent = () => (
    <div
      style={{
        display: tooltip.show ? 'block' : 'none',
        position: 'fixed',
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        width: '300px',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        color: 'white',
        padding: '12px',
        borderRadius: '6px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
        zIndex: 2000,
        fontSize: '12px',
        lineHeight: '1.4',
        border: '1px solid #0077B6',
        maxHeight: '400px',
        overflowY: 'auto',
      }}
      dangerouslySetInnerHTML={{ __html: tooltip.text }}
      onClick={() => hideTooltip()}
    />
  );

  // Color legend panel component
  const ColorLegendPanel = () => (
    <div
      ref={legendRef}
      style={{
        position: 'fixed',
        left: `${legendPosition.x}px`,
        top: `${legendPosition.y}px`,
        width: '300px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: '8px',
        padding: '15px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        zIndex: 1001,
        color: 'white',
        transition: isDragging ? 'none' : 'opacity 0.3s, transform 0.3s',
        opacity: showColorLegend ? 1 : 0,
        transform: showColorLegend ? 'translateY(0)' : 'translateY(-10px)',
        pointerEvents: showColorLegend ? 'auto' : 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          cursor: 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
      >
        <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          Color Legend{' '}
          <span style={{ fontSize: '10px', color: '#ccc' }}>
            (drag to move)
          </span>
        </h5>

        {/* Close button - implemented as a div with better styling */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowColorLegend(false);
            console.log('Close button clicked'); // Debug
          }}
          style={{
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: 1002, // Higher than parent
            marginLeft: '8px', // Space from other header elements
          }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent drag from starting
        >
          ×
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <h6
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            color: '#FF8500',
          }}
        >
          Cohort Colors
        </h6>
        <p
          style={{
            fontSize: '11px',
            margin: '0 0 8px 0',
            fontStyle: 'italic',
            color: '#ccc',
          }}
        >
          Cohorts are groups of nodes created in similar time periods
        </p>
        {cohortColors.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: item.color,
                border: '1px solid white',
                marginRight: '8px',
              }}
            />
            <span style={{ fontSize: '11px' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div>
        <h6
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            margin: '12px 0 8px 0',
            color: '#FF8500',
          }}
        >
          Value Colors
        </h6>
        <p
          style={{
            fontSize: '11px',
            margin: '0 0 8px 0',
            fontStyle: 'italic',
            color: '#ccc',
          }}
        >
          Node values based on hash data, using Viridis color scale
        </p>

        {/* Value color gradient */}
        <div
          style={{
            width: '100%',
            height: '24px',
            borderRadius: '4px',
            background:
              'linear-gradient(to right, #440154, #404388, #29788E, #22A884, #7AD151, #FDE725)',
            marginBottom: '10px',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        />

        {/* Value markers */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#ccc',
            marginBottom: '15px',
          }}
        >
          <span>0.0</span>
          <span>0.2</span>
          <span>0.4</span>
          <span>0.6</span>
          <span>0.8</span>
          <span>1.0</span>
        </div>

        {/* Color samples */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          {valueColors.map((item) => (
            <div
              key={item.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '48%',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: item.color,
                  marginRight: '8px',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              />
              <div style={{ fontSize: '11px' }}>
                <div>
                  {item.value.toFixed(1)}: {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '8px',
            borderRadius: '4px',
            marginTop: '10px',
          }}
        >
          <div style={{ fontSize: '11px', marginBottom: '5px' }}>
            <span style={{ fontWeight: 'bold', color: '#FF8500' }}>Note:</span>{' '}
            Values determined by node hash
          </div>
          <div style={{ fontSize: '10px', color: '#ccc' }}>
            Highest Work Path nodes appear in yellow/green (0.8-1.0 range)
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '15px',
          fontSize: '11px',
          padding: '8px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
        }}
      >
        <strong>💡 Tip:</strong> Use the "Color By" buttons to switch between
        these color schemes
      </div>
    </div>
  );

  return (
    <>
      {/* Color legend panel */}
      <ColorLegendPanel />

      {/* Tooltip component */}
      <TooltipComponent />

      {/* Main filter panel */}
      <div
        className="filter-panel"
        style={{
          position: 'fixed',
          top: '10px',
          right: '20px',
          zIndex: 1000,
          background: isHovered ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.3)' : 'none',
          minWidth: '220px',
          transition: 'all 0.3s ease',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateX(0)' : 'translateX(10px)',
          maxHeight: '95vh',
          overflowY: 'auto',
          pointerEvents: isHovered ? 'auto' : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          style={{
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <h5
            style={{
              color: '#fff',
              margin: '0 0 10px 0',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Search Node
            <div
              style={{
                marginLeft: '8px',
                cursor: 'help',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
              }}
              onMouseEnter={(e) => showTooltipFor('search', e)}
              onMouseLeave={hideTooltip}
            >
              ?
            </div>
          </h5>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter node ID or hash..."
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                border: '1px solid #0077B6',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
            <div style={{ marginTop: '5px', fontSize: '10px', color: '#ccc' }}>
              Search will highlight the node and its connected path
            </div>
          </div>

          <h5
            style={{
              color: '#fff',
              margin: '0 0 10px 0',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Layout Controls
            <div
              style={{
                marginLeft: '8px',
                cursor: 'help',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
              }}
              onMouseEnter={(e) => showTooltipFor('layout', e)}
              onMouseLeave={hideTooltip}
            >
              ?
            </div>
          </h5>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span
                style={{
                  color: '#fff',
                  fontSize: '12px',
                  display: 'block',
                  marginBottom: '5px',
                }}
              >
                Horizontal Spacing: {nodeSpacing}px
              </span>
              <input
                type="range"
                min="40"
                max="150"
                value={nodeSpacing}
                onChange={(e) => setNodeSpacing(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <span
                style={{
                  color: '#fff',
                  fontSize: '12px',
                  display: 'block',
                  marginBottom: '5px',
                }}
              >
                Vertical Spacing: {verticalSpacing}px
              </span>
              <input
                type="range"
                min="20"
                max="120"
                value={verticalSpacing}
                onChange={(e) => setVerticalSpacing(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginTop: '10px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={enableDragging}
                  onChange={(e) => setEnableDragging(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Enable Node Dragging
              </label>
            </div>
          </div>

          <h5
            style={{
              color: '#fff',
              margin: '0 0 10px 0',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Connectivity Filter
            <div
              style={{
                marginLeft: '8px',
                cursor: 'help',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
              }}
              onMouseEnter={(e) => showTooltipFor('connectivity', e)}
              onMouseLeave={hideTooltip}
            >
              ?
            </div>
          </h5>

          <div
            className="connectivity-filters"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '15px',
            }}
          >
            <select
              value={connectivityFilter}
              onChange={(e) =>
                setConnectivityFilter(e.target.value as ConnectivityType)
              }
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: '1px solid #0077B6',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                fontSize: '12px',
                marginBottom: '8px',
                width: '100%',
              }}
            >
              <option value={ConnectivityType.ALL}>
                All Nodes ({connectivityStats.total})
              </option>
              <option value={ConnectivityType.ORPHANS}>
                Orphans - No Children ({connectivityStats.orphans})
              </option>
              <option value={ConnectivityType.ROOTS}>
                Roots - No Parents ({connectivityStats.roots})
              </option>
              <option value={ConnectivityType.JUNCTION}>
                Junctions - Multiple In/Out ({connectivityStats.junctions})
              </option>
              <option value={ConnectivityType.HIGH_DEGREE}>
                High-Degree - Many Connections ({connectivityStats.highDegree})
              </option>
              <option value={ConnectivityType.BRIDGE}>
                Bridges - Connect Cohorts ({connectivityStats.bridges})
              </option>
            </select>
          </div>

          <h5
            style={{
              color: '#fff',
              margin: '0 0 10px 0',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Edge Type Filter
            <div
              style={{
                marginLeft: '8px',
                cursor: 'help',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
              }}
              onMouseEnter={(e) => showTooltipFor('edge', e)}
              onMouseLeave={hideTooltip}
            >
              ?
            </div>
          </h5>

          <div
            className="edge-filters"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '15px',
            }}
          >
            <select
              value={edgeFilter}
              onChange={(e) => setEdgeFilter(e.target.value as EdgeType)}
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: '1px solid #0077B6',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                fontSize: '12px',
                marginBottom: '8px',
                width: '100%',
              }}
            >
              <option value={EdgeType.ALL}>
                All Connections ({edgeStats.total})
              </option>
              <option value={EdgeType.INTRA_COHORT}>
                Within Same Cohort ({edgeStats.intraCohort})
              </option>
              <option value={EdgeType.CROSS_COHORT}>
                Between Different Cohorts ({edgeStats.crossCohort})
              </option>
              <option value={EdgeType.HWP}>
                Highest Work Path ({edgeStats.hwp})
              </option>
              <option value={EdgeType.BRIDGE}>
                Bridge Connections ({edgeStats.bridge})
              </option>
            </select>
          </div>

          <h5
            style={{
              color: '#fff',
              margin: '0 0 10px 0',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Filter Nodes
            <div
              style={{
                marginLeft: '8px',
                cursor: 'help',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
              }}
              onMouseEnter={(e) => showTooltipFor('filter', e)}
              onMouseLeave={hideTooltip}
            >
              ?
            </div>
          </h5>

          <div
            className="filter-buttons"
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <span
                style={{ color: '#fff', fontSize: '12px', minWidth: '65px' }}
              >
                Cohorts:
              </span>
              <select
                value={selectedCohorts}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedCohorts(value === 'all' ? 'all' : Number(value));
                }}
                style={{
                  flex: 1,
                  padding: '5px',
                  borderRadius: '4px',
                  border: '1px solid #0077B6',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  fontSize: '12px',
                }}
              >
                <option value="all">All cohorts</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <option key={value} value={value}>
                    Latest {value}
                  </option>
                ))}
              </select>
            </div>

            <button
              style={{
                background: showHWPOnly ? '#FF8500' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
              onClick={() => setShowHWPOnly(!showHWPOnly)}
            >
              Highest Work Path Only
            </button>

            <button
              style={{
                background: highlightOrphans
                  ? '#FF8500'
                  : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
              onClick={() => setHighlightOrphans(!highlightOrphans)}
            >
              Highlight Orphans
            </button>
          </div>

          <h5
            style={{
              color: '#fff',
              margin: '15px 0 10px 0',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Color By
            <button
              onClick={() => setShowColorLegend(!showColorLegend)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
              }}
              title="Show color legend"
            >
              ?
            </button>
          </h5>

          <div
            className="color-mode-buttons"
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <button
              style={{
                background:
                  colorMode === 'cohort' ? '#FF8500' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
              onClick={() => setColorMode('cohort')}
            >
              Cohort
            </button>

            <button
              style={{
                background:
                  colorMode === 'value' ? '#FF8500' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
              onClick={() => setColorMode('value')}
            >
              Value
            </button>
          </div>

          <h5
            style={{
              color: '#fff',
              margin: '15px 0 10px 0',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            Animation
          </h5>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              style={{
                background: paused ? '#FF8500' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
              onClick={() => setPaused(!paused)}
            >
              {paused ? 'Resume' : 'Pause'} Animation
            </button>
          </div>
        </div>
      </div>

      {/* Always visible tab indicator */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: '100px',
          width: '30px',
          height: '120px',
          borderRadius: '6px 0 0 6px',
          background: 'rgba(0,119,182,0.25)',
          cursor: 'pointer',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'background 0.3s',
        }}
        onClick={() => setIsHovered(true)}
        onMouseEnter={() => setIsHovered(true)}
      >
        <div
          style={{
            transform: 'rotate(-90deg)',
            color: 'rgba(255,255,255,0.8)',
            fontWeight: 'bold',
            fontSize: '14px',
            letterSpacing: '1px',
          }}
        >
          FILTERS
        </div>
      </div>
    </>
  );
};

export default BraidPoolDAGControls;
