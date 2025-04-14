import { useState, useEffect, useRef } from 'react';
import useSimulatorWebSocket from './useSimulatorWebSocket';
import { BraidData, BraidVisualizationData } from '../types/braid';
import publicApiClient from '../api/public/client';

interface UseSimulatorDataResult {
  braidData: BraidData | null;
  visualizationData: BraidVisualizationData | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook to fetch and format data from the simulator for visualization
 */
export const useSimulatorData = (): UseSimulatorDataResult => {
  const [braidData, setBraidData] = useState<BraidData | null>(null);
  const [visualizationData, setVisualizationData] =
    useState<BraidVisualizationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Flag to prevent excessive polling and memory leaks
  const isMounted = useRef(true);
  const isRefreshing = useRef(false);
  const lastRefreshTime = useRef(0);
  const MIN_REFRESH_INTERVAL = 30000; // Minimum 30 seconds between refreshes

  // Connect to simulator WebSocket
  const {
    status: wsStatus,
    data: wsData,
    error: wsError,
  } = useSimulatorWebSocket({
    fallbackToMock: true,
  });

  // Function to refresh data
  const refresh = async () => {
    // Prevent multiple simultaneous refreshes and respect minimum refresh interval
    const now = Date.now();
    if (
      isRefreshing.current ||
      now - lastRefreshTime.current < MIN_REFRESH_INTERVAL
    ) {
      console.log(
        '🛑 Skipping refresh: already in progress or too soon after last refresh'
      );
      return;
    }

    isRefreshing.current = true;
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching simulator data...');
      const data = await publicApiClient.getBraidData();

      // Check if component is still mounted before updating state
      if (isMounted.current) {
        console.log('✅ Received simulator data:', data);
        setBraidData(data);

        // Transform data for visualization
        const visualData = transformBraidData(data);
        setVisualizationData(visualData);

        // Update last refresh time
        lastRefreshTime.current = Date.now();
      } else {
        console.log('⏹️ Component unmounted, skipping state update');
      }
    } catch (err) {
      console.error('❌ Error fetching simulator data:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
      isRefreshing.current = false;
    }
  };

  // Initial data fetch
  useEffect(() => {
    isMounted.current = true;
    refresh();

    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle WebSocket data updates
  useEffect(() => {
    if (wsData && wsStatus === 'connected' && isMounted.current) {
      console.log('📥 Received WebSocket update, refreshing data...');
      refresh();
    }
  }, [wsData, wsStatus]);

  // Handle WebSocket errors
  useEffect(() => {
    if (wsError && isMounted.current) {
      console.warn('⚠️ WebSocket error, falling back to HTTP API:', wsError);
    }
  }, [wsError]);

  return {
    braidData,
    visualizationData,
    isLoading,
    error: error || wsError,
    refresh,
  };
};

/**
 * Transform BraidData into a format suitable for visualization
 */
const transformBraidData = (data: BraidData): BraidVisualizationData => {
  const { parents, children, cohorts } = data;

  // Limit the number of nodes to prevent performance issues
  const MAX_NODES = 1000;
  const nodeIds = Object.keys(parents);
  const limitedNodeIds =
    nodeIds.length > MAX_NODES ? nodeIds.slice(0, MAX_NODES) : nodeIds;

  if (nodeIds.length > MAX_NODES) {
    console.warn(
      `⚠️ Limiting visualization to ${MAX_NODES} nodes (out of ${nodeIds.length}) for performance`
    );
  }

  // Create nodes
  const nodes = limitedNodeIds.map((nodeId) => {
    const id = parseInt(nodeId);
    const nodeParents = parents[nodeId] || [];
    const nodeChildren = children[nodeId] || [];

    // Find which cohort this node belongs to
    const cohortIndex = cohorts.findIndex((cohort) => cohort.includes(id));

    return {
      id,
      parents: nodeParents,
      children: nodeChildren,
      cohort: cohortIndex >= 0 ? cohortIndex : 0,
      isTip: data.tips.includes(id),
    };
  });

  // Create links
  const links: { source: number; target: number; isHighWorkPath?: boolean }[] =
    [];

  // For each node, create links to its parents
  nodes.forEach((node) => {
    node.parents.forEach((parentId) => {
      // Only create links where both the source and target are in our limitedNodeIds
      if (limitedNodeIds.includes(parentId.toString())) {
        links.push({
          source: parentId,
          target: node.id,
          isHighWorkPath: false, // We'll set this later if we have the data
        });
      }
    });
  });

  console.log(
    `🔄 Transformed data: ${nodes.length} nodes, ${links.length} links, ${cohorts.length} cohorts`
  );

  return {
    nodes,
    links,
    cohorts,
  };
};

export default useSimulatorData;
