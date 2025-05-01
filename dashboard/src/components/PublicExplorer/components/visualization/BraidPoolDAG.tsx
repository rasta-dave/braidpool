import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { io, Socket } from 'socket.io-client';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardTitle from '@mui/material/Typography';
import '../../PublicExplorer.css';
import Button from '@mui/material/Button';
import { CircularProgress } from '@mui/material';
import BraidPoolDAGControls from './BraidPoolDAGControls';
import {
  ConnectivityType,
  calculateConnectivityStats,
  filterNodesByConnectivity,
  findBridgeNodes,
} from './ConnectivityUtils';

// Define interfaces locally to avoid import issues
interface GraphNode {
  id: string;
  parents: string[];
  children: string[];
}

interface NodeIdMapping {
  [hash: string]: string; // maps hash to sequential ID
}

interface GraphData {
  highest_work_path: string[];
  parents: Record<string, string[]>;
  children: Record<string, string[]>;
  cohorts: string[][];
  bead_count: number;
}

interface Position {
  x: number;
  y: number;
}

const BraidPoolDAG: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const width = 2400;
  const height = 400;
  const COLORS = [
    `rgba(${217}, ${95}, ${2}, 1)`,
    `rgba(${117}, ${112}, ${179}, 1)`,
    `rgba(${102}, ${166}, ${30}, 1)`,
    `rgba(${231}, ${41}, ${138}, 1)`,
  ];

  // Filter state
  const [showHWPOnly, setShowHWPOnly] = useState(false);
  const [highlightOrphans, setHighlightOrphans] = useState(false);
  const [colorMode, setColorMode] = useState<'cohort' | 'value'>('cohort');
  const [paused, setPaused] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(5);
  // New connectivity filter state
  const [connectivityFilter, setConnectivityFilter] =
    useState<ConnectivityType>(ConnectivityType.ALL);
  const [connectivityStats, setConnectivityStats] = useState({
    orphans: 0,
    roots: 0,
    junctions: 0,
    highDegree: 0,
    bridges: 0,
    total: 0,
  });

  const [nodeIdMap, setNodeIdMap] = useState<NodeIdMapping>({});
  const [selectedCohorts, setSelectedCohorts] = useState<number | 'all'>(10);

  // Node values based on hash data
  const [nodeValues, setNodeValues] = useState<Record<string, number>>({});

  const nodeRadius = 20;
  const margin = { top: 0, right: 0, bottom: 0, left: 50 };
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const COLUMN_WIDTH = 80;
  const VERTICAL_SPACING = 60;

  const layoutNodes = (
    allNodes: GraphNode[],
    hwPath: string[],
    cohorts: string[][]
  ): Record<string, Position> => {
    const positions: Record<string, Position> = {};
    const columnOccupancy: Record<number, number> = {};
    const hwPathSet = new Set(hwPath);
    const centerY = height / 2;
    const cohortMap = new Map<string, number>();
    cohorts.forEach((cohort, index) => {
      cohort.forEach((nodeId) => cohortMap.set(nodeId, index));
    });

    let currentX = margin.left;
    let prevCohort: number | undefined;
    const hwPathColumns: number[] = [];

    hwPath.forEach((nodeId, index) => {
      const currentCohort = cohortMap.get(nodeId);

      if (prevCohort !== undefined && currentCohort !== prevCohort) {
        currentX += COLUMN_WIDTH;
      }

      positions[nodeId] = { x: currentX, y: centerY };
      hwPathColumns.push(currentX);
      columnOccupancy[index] = 0;

      prevCohort = currentCohort;
      currentX += COLUMN_WIDTH;
    });

    const generations = new Map<string, number>();
    const remainingNodes = allNodes.filter((node) => !hwPathSet.has(node.id));

    remainingNodes.forEach((node) => {
      const hwpParents = node.parents.filter((p) => hwPathSet.has(p));
      if (hwpParents.length > 0) {
        const minHWPIndex = Math.min(
          ...hwpParents.map((p) => hwPath.indexOf(p))
        );
        generations.set(node.id, minHWPIndex + 1);
      } else {
        const parentGens = node.parents.map((p) => generations.get(p) || 0);
        generations.set(
          node.id,
          parentGens.length > 0 ? Math.max(...parentGens) + 1 : 0
        );
      }
    });

    remainingNodes.sort(
      (a, b) => (generations.get(a.id) || 0) - (generations.get(b.id) || 0)
    );

    const tipNodes: string[] = [];

    remainingNodes.forEach((node) => {
      if (node.parents.length === 1 && !node.children?.length) {
        tipNodes.push(node.id);
      }
      const positionedParents = node.parents.filter((p) => positions[p]);

      let targetX: number;
      let colKey: number;

      if (positionedParents.length === 0) {
        colKey = 0;
        while (
          columnOccupancy[colKey] !== undefined &&
          columnOccupancy[colKey] >= 10
        ) {
          colKey++;
        }
        targetX = margin.left + colKey * COLUMN_WIDTH;
      } else {
        const maxParentX = Math.max(
          ...positionedParents.map((p) => positions[p].x)
        );
        targetX = maxParentX + COLUMN_WIDTH;

        const hwpParents = positionedParents.filter((p) => hwPathSet.has(p));
        if (hwpParents.length > 0) {
          const rightmostHWPParentX = Math.max(
            ...hwpParents.map((p) => positions[p].x)
          );
          const parentIndex = hwPathColumns.indexOf(rightmostHWPParentX);
          if (parentIndex >= 0 && parentIndex < hwPathColumns.length - 1) {
            targetX = hwPathColumns[parentIndex + 1];
          }
        }

        colKey = Math.round((targetX - margin.left) / COLUMN_WIDTH);
      }

      let count = columnOccupancy[colKey] || 0;
      const direction = count % 2 !== 0 ? 1 : -1;
      const level = Math.ceil((count + 1) / 2);
      const yOffset = direction * level * VERTICAL_SPACING;
      const yPos = centerY + yOffset;

      columnOccupancy[colKey] = count + 1;

      positions[node.id] = { x: targetX, y: yPos };
    });

    const maxColumnX = Math.max(
      ...Object.values(positions).map((pos) => pos.x)
    );
    tipNodes.forEach((tipId) => {
      if (positions[tipId]) {
        positions[tipId].x = maxColumnX;
      }
    });

    return positions;
  };

  const [_socket, setSocket] = useState<Socket | null>(null);
  const [_connectionStatus, setConnectionStatus] = useState('Disconnected');

  const [totalBeads, setTotalBeads] = useState<number>(0);
  const [totalCohorts, setTotalCohorts] = useState<number>(0);
  const [maxCohortSize, setMaxCohortSize] = useState<number>(0);
  const [hwpLength, setHwpLength] = useState<number>(0);

  const [defaultZoom, setDefaultZoom] = useState(0.8);
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(
    null
  );

  // Calculate node values based on hash data
  const calculateNodeValues = (graphData: GraphData) => {
    if (!graphData) return;

    const values: Record<string, number> = {};
    const hwPathSet = new Set(graphData.highest_work_path);

    // Process all nodes to extract value from hash
    Object.keys(graphData.parents).forEach((nodeId) => {
      // Extract numeric value from the hash using different parts to increase entropy
      // Use the full hash for better distribution of values
      let numericValue = 0;

      // Use multiple byte segments for better distribution
      const segment1 = parseInt(nodeId.substring(0, 2), 16) / 255;
      const segment2 = parseInt(nodeId.substring(2, 4), 16) / 255;
      const segment3 = parseInt(nodeId.substring(4, 6), 16) / 255;

      // Combine segments for more variety
      numericValue = (segment1 + segment2 + segment3) / 3;

      // Spread the values out more (amplify differences)
      numericValue = Math.pow(numericValue, 0.7); // Apply a power function to spread values

      // Boost HWP nodes for better visualization
      if (hwPathSet.has(nodeId)) {
        // Ensure HWP nodes are visually distinct
        numericValue = 0.7 + numericValue * 0.3; // HWP nodes get 0.7-1.0 range
      }

      values[nodeId] = numericValue;
    });

    // Debug info - log distribution of values
    const valueCounts = {
      '0-0.2': 0,
      '0.2-0.4': 0,
      '0.4-0.6': 0,
      '0.6-0.8': 0,
      '0.8-1.0': 0,
    };
    Object.values(values).forEach((v) => {
      if (v < 0.2) valueCounts['0-0.2']++;
      else if (v < 0.4) valueCounts['0.2-0.4']++;
      else if (v < 0.6) valueCounts['0.4-0.6']++;
      else if (v < 0.8) valueCounts['0.6-0.8']++;
      else valueCounts['0.8-1.0']++;
    });

    console.log('🎨 Value distribution:', valueCounts);
    setNodeValues(values);
  };

  useEffect(() => {
    if (paused) return;

    const url = 'ws://localhost:65433/';
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('🔌 Connected to WebSocket', url);
      setConnectionStatus('Connected');
    };

    socket.onclose = () => {
      setConnectionStatus('Disconnected');
    };

    socket.onerror = (err) => {
      setConnectionStatus(`Error: ${err}`);
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const parsedData = parsed.data;
        if (!parsedData?.parents || typeof parsedData.parents !== 'object') {
          console.warn("⚠️ Invalid 'parents' field in parsedData:", parsedData);
          return;
        }

        const children: Record<string, string[]> = {};
        if (parsedData?.parents && typeof parsedData.parents === 'object') {
          Object.entries(parsedData.parents).forEach(([nodeId, parents]) => {
            (parents as string[]).forEach((parentId) => {
              if (!children[parentId]) {
                children[parentId] = [];
              }
              children[parentId].push(nodeId);
            });
          });
        }

        const bead_count =
          parsedData?.parents && typeof parsedData.parents === 'object'
            ? Object.keys(parsedData.parents).length
            : 0;

        const graphData: GraphData = {
          highest_work_path: parsedData.highest_work_path,
          parents: parsedData.parents,
          cohorts: parsedData.cohorts,
          children,
          bead_count,
        };

        const newMapping: NodeIdMapping = {};
        let nextId = 1;
        Object.keys(parsedData.parents).forEach((hash) => {
          if (!newMapping[hash]) {
            newMapping[hash] = nextId.toString();
            nextId++;
          }
        });

        setNodeIdMap(newMapping);
        setGraphData(graphData);
        setTotalBeads(bead_count);
        setTotalCohorts(parsedData.cohorts.length);
        setMaxCohortSize(
          Math.max(...parsedData.cohorts.map((c: string | any[]) => c.length))
        );
        setHwpLength(parsedData.highest_work_path.length);
        setLoading(false);
        calculateNodeValues(graphData);

        // Calculate connectivity stats
        const stats = calculateConnectivityStats(graphData);
        setConnectivityStats(stats);
      } catch (err) {
        setError('Error processing graph data: ');
        console.error('🔴 Error processing graph data:', err);
        setLoading(false);
      }
    };

    return () => socket.close();
  }, [paused]); // Re-run when paused changes

  const resetZoom = () => {
    if (svgRef.current && zoomBehavior.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(
          zoomBehavior.current.transform,
          d3.zoomIdentity.scale(defaultZoom)
        );
    }
  };

  // Color scales for different color modes
  const getValueColor = (value: number) => {
    // Use a more vibrant and diverse color palette
    if (value < 0.2) {
      // Deep blue to light blue
      return d3.interpolateViridis(value * 5);
    } else if (value < 0.4) {
      // Light blue to green
      return d3.interpolateTurbo((value - 0.2) * 5);
    } else if (value < 0.6) {
      // Green to yellow
      return d3.interpolateInferno((value - 0.4) * 5);
    } else if (value < 0.8) {
      // Yellow to orange
      return d3.interpolatePlasma((value - 0.6) * 5);
    } else {
      // Orange to red (HWP nodes mostly fall here)
      return d3.interpolateMagma((value - 0.8) * 5);
    }
  };

  useEffect(() => {
    if (!svgRef.current || !graphData) return;

    // Filter nodes based on selected cohorts
    const filteredCohorts = graphData.cohorts.slice(-selectedCohorts);
    const filteredCohortNodes = new Set(filteredCohorts.flat());

    // Apply connectivity filter
    const connectivityFilteredNodes = filterNodesByConnectivity(
      graphData,
      connectivityFilter
    );

    // Combine filters - a node must pass both filters to be visible
    const visibleNodeIds = new Set<string>();
    Array.from(connectivityFilteredNodes).forEach((nodeId) => {
      if (filteredCohortNodes.has(nodeId)) {
        visibleNodeIds.add(nodeId);
      }
    });

    const tooltip = d3
      .select(tooltipRef.current)
      .style('position', 'fixed')
      .style('visibility', 'hidden')
      .style('background', '#0077B6')
      .style('color', 'white')
      .style('border', '1px solid #FF8500')
      .style('border-radius', '5px')
      .style('padding', '10px')
      .style('box-shadow', '2px 2px 5px rgba(0,0,0,0.2)')
      .style('pointer-events', 'none')
      .style('z-index', '10')
      .style('bottom', '20px')
      .style('right', '20px');

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svg.append('g');

    zoomBehavior.current = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        container.attr('transform', event.transform.toString());
      });

    const allNodes = Object.keys(graphData.parents)
      .filter((id) => visibleNodeIds.has(id)) // Only include visible nodes
      .map((id) => ({
        id,
        parents: graphData.parents[id],
        children: graphData.children[id],
      }));

    const hwPath = graphData.highest_work_path;
    const cohorts = graphData.cohorts;
    const positions = layoutNodes(allNodes, hwPath, cohorts as string[][]);

    // Find the bounds of the graph to center it properly
    let minX = Infinity,
      maxX = -Infinity;
    Object.values(positions).forEach((pos) => {
      if (pos.x < minX) minX = pos.x;
      if (pos.x > maxX) maxX = pos.x;
    });

    const graphWidth = maxX - minX + 2 * nodeRadius;
    const centerOffset = (width - graphWidth) / 2 - minX;

    svg
      .call(zoomBehavior.current)
      .call(
        zoomBehavior.current.transform,
        d3.zoomIdentity.translate(centerOffset, 0).scale(defaultZoom)
      );

    const hwPathSet = new Set(hwPath);

    const visibleNodes = allNodes.filter((node) => visibleNodeIds.has(node.id));
    let minVisibleX = Infinity;
    visibleNodes.forEach((node) => {
      const x = positions[node.id]?.x || 0;
      if (x < minVisibleX) minVisibleX = x;
    });
    const offsetX = margin.left - minVisibleX;

    const links: { source: string; target: string }[] = [];
    allNodes.forEach((node) => {
      if (Array.isArray(node.children)) {
        node.children.forEach((childId) => {
          // Only include links where both ends are visible
          if (visibleNodeIds.has(childId)) {
            links.push({ target: node.id, source: childId });
          }
        });
      }
    });

    const nodes = container
      .selectAll('.node')
      .data(allNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr(
        'transform',
        (d) =>
          `translate(${(positions[d.id]?.x || 0) + offsetX},${
            positions[d.id]?.y || 0
          })`
      )
      .style('display', (d) => {
        if (!visibleNodeIds.has(d.id)) return 'none';
        if (showHWPOnly && !hwPathSet.has(d.id)) return 'none';
        return 'inline';
      });

    const cohortMap = new Map<string, number>();
    (cohorts as string[][]).forEach((cohort, index) => {
      cohort.forEach((nodeId) => cohortMap.set(nodeId, index));
    });

    nodes
      .append('circle')
      .attr('r', nodeRadius)
      .attr('fill', (d) => {
        // Apply different coloring based on selected colorMode
        if (colorMode === 'cohort') {
          const cohortIndex = cohortMap.get(d.id);
          if (cohortIndex === undefined) return COLORS[0];
          const startingIndex = Math.max(
            0,
            totalCohorts -
              (typeof selectedCohorts === 'number'
                ? selectedCohorts
                : totalCohorts)
          );
          const adjustedIndex = cohortIndex - startingIndex;
          return COLORS[adjustedIndex % COLORS.length];
        } else if (colorMode === 'value') {
          return getValueColor(nodeValues[d.id] || 0);
        }
        return COLORS[0];
      })
      .attr('stroke', (d) => {
        // Highlight specific node types based on filters
        if (highlightOrphans && (!d.children || d.children.length === 0))
          return '#FF0000';
        if (hwPathSet.has(d.id)) return '#FF8500';
        return '#fff';
      })
      .attr('stroke-width', (d) => {
        // Make highlighted nodes have thicker borders
        if (highlightOrphans && (!d.children || d.children.length === 0))
          return 3;
        if (hwPathSet.has(d.id)) return 3;
        return 2;
      })
      .attr('opacity', (d) => {
        if (showHWPOnly && !hwPathSet.has(d.id)) return 0.3;
        return 1;
      })
      .on('mouseover', function (event: MouseEvent, d: GraphNode) {
        d3.select(this).attr('stroke', '#FF8500').attr('stroke-width', 3);

        const cohortIndex = cohortMap.get(d.id);
        const isHWP = hwPathSet.has(d.id);
        const isOrphan = !d.children || d.children.length === 0;

        // Calculate hex value for display
        const hexValue = d.id.substring(0, 16) + '...';
        const numericValue = nodeValues[d.id] || 0;

        // Connectivity information
        const connectivityInfo = [];
        if (d.parents.length === 0) connectivityInfo.push('Root');
        if (d.children.length === 0) connectivityInfo.push('Orphan');
        if (d.parents.length > 1 && d.children.length > 1)
          connectivityInfo.push('Junction');
        if (d.parents.length + d.children.length > 5)
          connectivityInfo.push('High-Degree');

        // Check if it's a bridge node
        const bridgeNodes = findBridgeNodes(graphData);
        if (bridgeNodes.has(d.id)) connectivityInfo.push('Bridge');

        const connectivityString =
          connectivityInfo.length > 0
            ? connectivityInfo.join(', ')
            : 'Standard';

        const tooltipContent = `
                <div><strong>ID:</strong> ${
                  nodeIdMap[d.id] || '?'
                } (${hexValue})</div>
                <div><strong>Cohort:</strong> ${
                  cohortIndex !== undefined ? cohortIndex : 'N/A'
                }</div>
                <div><strong>Highest Work Path:</strong> ${
                  isHWP ? 'Yes' : 'No'
                }</div>
                <div><strong>Type:</strong> ${connectivityString}</div>
                <div><strong>Connections:</strong> ${d.parents.length} in, ${
          d.children.length
        } out</div>
                <div><strong>Hash Value:</strong> ${numericValue.toFixed(
                  4
                )}</div>
                <div><strong>Parents:</strong> ${
                  d.parents.length > 0
                    ? d.parents.map((p) => `${nodeIdMap[p] || '?'}`).join(', ')
                    : 'None'
                }</div>
                <div><strong>Children:</strong> ${
                  d.children && d.children.length > 0
                    ? d.children.map((c) => `${nodeIdMap[c] || '?'}`).join(', ')
                    : 'None'
                }</div>
                `;

        tooltip.html(tooltipContent).style('visibility', 'visible');
      })
      .on('mouseout', function () {
        d3.select(this)
          .attr('stroke', (d: any) => {
            if (highlightOrphans && (!d.children || d.children.length === 0))
              return '#FF0000';
            if (hwPathSet.has(d.id)) return '#FF8500';
            return '#fff';
          })
          .attr('stroke-width', (d: any) => {
            if (highlightOrphans && (!d.children || d.children.length === 0))
              return 3;
            if (hwPathSet.has(d.id)) return 3;
            return 2;
          });
        tooltip.style('visibility', 'hidden');
      });

    nodes
      .append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .text((d) => nodeIdMap[d.id] || '?')
      .attr('fill', '#fff')
      .style('font-size', 14)
      .style('pointer-events', 'none'); // Prevent text from intercepting mouse events

    container
      .append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px');

    container
      .append('defs')
      .selectAll('marker')
      .data([
        { id: 'arrow-blue', color: '#48CAE4' },
        { id: 'arrow-orange', color: '#FF8500' },
      ])
      .enter()
      .append('marker')
      .attr('id', (d) => d.id)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 15)
      .attr('markerHeight', 12)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', (d) => d.color);

    container
      .selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('x1', (d) => {
        const src = {
          x: (positions[d.source]?.x || 0) + offsetX,
          y: positions[d.source]?.y || 0,
        };
        const tgt = {
          x: (positions[d.target]?.x || 0) + offsetX,
          y: positions[d.target]?.y || 0,
        };
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ratio = nodeRadius / dist;
        return src.x + dx * ratio;
      })
      .attr('y1', (d) => {
        const src = {
          x: (positions[d.source]?.x || 0) + offsetX,
          y: positions[d.source]?.y || 0,
        };
        const tgt = {
          x: (positions[d.target]?.x || 0) + offsetX,
          y: positions[d.target]?.y || 0,
        };
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ratio = nodeRadius / dist;
        return src.y + dy * ratio;
      })
      .attr('x2', (d) => {
        const src = {
          x: (positions[d.source]?.x || 0) + offsetX,
          y: positions[d.source]?.y || 0,
        };
        const tgt = {
          x: (positions[d.target]?.x || 0) + offsetX,
          y: positions[d.target]?.y || 0,
        };
        const dx = src.x - tgt.x;
        const dy = src.y - tgt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ratio = nodeRadius / dist;
        return tgt.x + dx * ratio;
      })
      .attr('y2', (d) => {
        const src = {
          x: (positions[d.source]?.x || 0) + offsetX,
          y: positions[d.source]?.y || 0,
        };
        const tgt = {
          x: (positions[d.target]?.x || 0) + offsetX,
          y: positions[d.target]?.y || 0,
        };
        const dx = src.x - tgt.x;
        const dy = src.y - tgt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ratio = nodeRadius / dist;
        return tgt.y + dy * ratio;
      })
      .attr('stroke', (d) =>
        hwPathSet.has(d.source) && hwPathSet.has(d.target)
          ? '#FF8500'
          : '#48CAE4'
      )
      .attr('stroke-width', 1.5)
      .attr('marker-end', (d) =>
        hwPathSet.has(d.source) && hwPathSet.has(d.target)
          ? 'url(#arrow-orange)'
          : 'url(#arrow-blue)'
      )
      .style('display', (d) => {
        if (!visibleNodeIds.has(d.source) || !visibleNodeIds.has(d.target)) {
          return 'none';
        }
        if (
          showHWPOnly &&
          (!hwPathSet.has(d.source) || !hwPathSet.has(d.target))
        ) {
          return 'none';
        }
        return 'inline';
      })
      .style('opacity', (d) => {
        if (
          showHWPOnly &&
          (!hwPathSet.has(d.source) || !hwPathSet.has(d.target))
        ) {
          return 0.3;
        }
        return 1;
      });
  }, [
    graphData,
    defaultZoom,
    selectedCohorts,
    showHWPOnly,
    highlightOrphans,
    colorMode,
    nodeValues,
    connectivityFilter, // Add connectivity filter as dependency
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex flex-col items-center">
          <CircularProgress className="h-8 w-8 animate-spin text-[#FF8500]" />
          <p className="mt-4 text-[#0077B6]">Loading graph data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-[#0077B6] mb-4">No graph data available</div>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <BraidPoolDAGControls
          showHWPOnly={showHWPOnly}
          setShowHWPOnly={setShowHWPOnly}
          highlightOrphans={highlightOrphans}
          setHighlightOrphans={setHighlightOrphans}
          colorMode={colorMode}
          setColorMode={setColorMode}
          paused={paused}
          setPaused={setPaused}
          animationSpeed={animationSpeed}
          setAnimationSpeed={setAnimationSpeed}
          selectedCohorts={selectedCohorts}
          setSelectedCohorts={setSelectedCohorts}
          connectivityFilter={connectivityFilter}
          setConnectivityFilter={setConnectivityFilter}
          connectivityStats={connectivityStats}
        />

        <Card
          style={{
            width: '100%',
            boxShadow: 'none',
            borderRadius: '8px',
            overflow: 'hidden',
            border: 'none',
          }}
        >
          <CardContent
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '10px',
            }}
          >
            <svg
              ref={svgRef}
              width={width}
              height={height}
              style={{
                display: 'block',
                margin: '0 auto',
              }}
            />
          </CardContent>
          <div ref={tooltipRef}></div>
        </Card>
      </div>
    </div>
  );
};

export default BraidPoolDAG;
