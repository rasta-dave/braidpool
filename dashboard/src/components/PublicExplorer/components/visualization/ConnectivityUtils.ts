/**
 * Main data structure for the braid/DAG
 */
export interface GraphData {
  highest_work_path: string[];
  parents: Record<string, string[]>;
  children: Record<string, string[]>;
  cohorts: string[][];
  bead_count: number;
}

/**
 * Node connectivity types based on their number of connections
 */
export enum ConnectivityType {
  ALL = 'all',
  ORPHANS = 'orphans', // Nodes with no children
  ROOTS = 'roots', // Nodes with no parents
  JUNCTION = 'junction', // Nodes with multiple parents and children
  HIGH_DEGREE = 'high-degree', // Nodes with high total connections
  BRIDGE = 'bridge', // Nodes that connect different parts of the graph
}

/**
 * Analyzes a graph node and returns its connectivity type
 */
export const getNodeConnectivityType = (
  nodeId: string,
  parents: string[],
  children: string[]
): ConnectivityType[] => {
  const types: ConnectivityType[] = [];

  // Basic connectivity types
  if (children.length === 0) {
    types.push(ConnectivityType.ORPHANS);
  }

  if (parents.length === 0) {
    types.push(ConnectivityType.ROOTS);
  }

  if (parents.length > 1 && children.length > 1) {
    types.push(ConnectivityType.JUNCTION);
  }

  // High degree nodes (more than 5 total connections)
  if (parents.length + children.length > 5) {
    types.push(ConnectivityType.HIGH_DEGREE);
  }

  return types;
};

/**
 * Analyzes the graph data to identify bridge nodes that connect different cohorts
 */
export const findBridgeNodes = (graphData: GraphData): Set<string> => {
  const bridgeNodes = new Set<string>();
  const cohortMap = new Map<string, number>();

  // Map nodes to their cohort
  graphData.cohorts.forEach((cohort: string[], index: number) => {
    cohort.forEach((nodeId: string) => {
      cohortMap.set(nodeId, index);
    });
  });

  // Find nodes that connect different cohorts
  Object.entries(graphData.parents).forEach(([nodeId, parents]) => {
    const nodeCohort = cohortMap.get(nodeId);
    const children = graphData.children[nodeId] || [];

    // Check if this node connects to different cohorts
    const connectedCohorts = new Set<number>();
    if (nodeCohort !== undefined) connectedCohorts.add(nodeCohort);

    // Add parent cohorts
    (parents as string[]).forEach((parentId: string) => {
      const parentCohort = cohortMap.get(parentId);
      if (parentCohort !== undefined) connectedCohorts.add(parentCohort);
    });

    // Add child cohorts
    children.forEach((childId: string) => {
      const childCohort = cohortMap.get(childId);
      if (childCohort !== undefined) connectedCohorts.add(childCohort);
    });

    // If node connects more than one cohort, it's a bridge
    if (connectedCohorts.size > 1) {
      bridgeNodes.add(nodeId);
    }
  });

  return bridgeNodes;
};

/**
 * Filters nodes based on selected connectivity type
 */
export const filterNodesByConnectivity = (
  graphData: GraphData,
  connectivityType: ConnectivityType
): Set<string> => {
  const filteredNodes = new Set<string>();

  // If ALL, return all nodes
  if (connectivityType === ConnectivityType.ALL) {
    Object.keys(graphData.parents).forEach((nodeId) =>
      filteredNodes.add(nodeId)
    );
    return filteredNodes;
  }

  // For BRIDGE type, use the bridge finding algorithm
  if (connectivityType === ConnectivityType.BRIDGE) {
    return findBridgeNodes(graphData);
  }

  // For other types, check each node
  Object.entries(graphData.parents).forEach(([nodeId, parents]) => {
    const children = graphData.children[nodeId] || [];
    const nodeTypes = getNodeConnectivityType(
      nodeId,
      parents as string[],
      children
    );

    if (nodeTypes.includes(connectivityType)) {
      filteredNodes.add(nodeId);
    }
  });

  return filteredNodes;
};

/**
 * Calculate connectivity statistics for the graph
 */
export const calculateConnectivityStats = (graphData: GraphData) => {
  const stats = {
    orphans: 0,
    roots: 0,
    junctions: 0,
    highDegree: 0,
    bridges: 0,
    total: Object.keys(graphData.parents).length,
  };

  // Calculate individual type counts
  Object.entries(graphData.parents).forEach(([nodeId, parents]) => {
    const children = graphData.children[nodeId] || [];
    const nodeTypes = getNodeConnectivityType(
      nodeId,
      parents as string[],
      children
    );

    if (nodeTypes.includes(ConnectivityType.ORPHANS)) stats.orphans++;
    if (nodeTypes.includes(ConnectivityType.ROOTS)) stats.roots++;
    if (nodeTypes.includes(ConnectivityType.JUNCTION)) stats.junctions++;
    if (nodeTypes.includes(ConnectivityType.HIGH_DEGREE)) stats.highDegree++;
  });

  // Bridge nodes require a separate calculation
  const bridges = findBridgeNodes(graphData);
  stats.bridges = bridges.size;

  return stats;
};
