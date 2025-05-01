/**
 * Utility file for edge classification and filtering
 */

import { GraphData } from './ConnectivityUtils';

/**
 * Enum defining different edge types in the graph
 */
export enum EdgeType {
  ALL = 'all',
  INTRA_COHORT = 'intra-cohort', // Edges between nodes in the same cohort
  CROSS_COHORT = 'cross-cohort', // Edges between nodes in different cohorts
  HWP = 'hwp', // Edges that are part of the Highest Work Path
  BRIDGE = 'bridge', // Edges that bridge different parts of the graph
}

/**
 * Interface representing a graph edge with source and target IDs
 */
export interface Edge {
  source: string;
  target: string;
}

/**
 * Classifies an edge based on the relationship between its source and target nodes
 */
export const classifyEdge = (
  edge: Edge,
  graphData: GraphData,
  cohortMap: Map<string, number>
): EdgeType[] => {
  const types: EdgeType[] = [];
  const sourceId = edge.source;
  const targetId = edge.target;

  // Check if it's an HWP edge
  const hwpSet = new Set(graphData.highest_work_path);
  if (hwpSet.has(sourceId) && hwpSet.has(targetId)) {
    types.push(EdgeType.HWP);
  }

  // Check if it's an intra-cohort or cross-cohort edge
  const sourceCohort = cohortMap.get(sourceId);
  const targetCohort = cohortMap.get(targetId);

  if (sourceCohort !== undefined && targetCohort !== undefined) {
    if (sourceCohort === targetCohort) {
      types.push(EdgeType.INTRA_COHORT);
    } else {
      types.push(EdgeType.CROSS_COHORT);
    }
  }

  // Check if it's a bridge edge
  // A bridge edge connects nodes that would otherwise be in separate components
  const sourceChildren = graphData.children[sourceId] || [];
  const targetParents = graphData.parents[targetId] || [];

  // If this is the only connection between components, it's a bridge
  if (
    sourceChildren.length === 1 &&
    sourceChildren[0] === targetId &&
    targetParents.length === 1 &&
    targetParents[0] === sourceId
  ) {
    types.push(EdgeType.BRIDGE);
  }

  return types;
};

/**
 * Builds a cohort map for quick lookup of which cohort a node belongs to
 */
export const buildCohortMap = (graphData: GraphData): Map<string, number> => {
  const cohortMap = new Map<string, number>();
  graphData.cohorts.forEach((cohort: string[], index: number) => {
    cohort.forEach((nodeId: string) => {
      cohortMap.set(nodeId, index);
    });
  });
  return cohortMap;
};

/**
 * Generates all edges in the graph based on parent-child relationships
 */
export const generateEdges = (graphData: GraphData): Edge[] => {
  const edges: Edge[] = [];

  Object.entries(graphData.children).forEach(([nodeId, children]) => {
    (children as string[]).forEach((childId: string) => {
      edges.push({
        source: nodeId,
        target: childId,
      });
    });
  });

  return edges;
};

/**
 * Filters edges based on the specified edge type
 */
export const filterEdgesByType = (
  graphData: GraphData,
  edgeType: EdgeType
): Edge[] => {
  // If "ALL" is selected, include all edges
  if (edgeType === EdgeType.ALL) {
    return generateEdges(graphData);
  }

  const cohortMap = buildCohortMap(graphData);
  const allEdges = generateEdges(graphData);

  return allEdges.filter((edge) => {
    const types = classifyEdge(edge, graphData, cohortMap);
    return types.includes(edgeType);
  });
};

/**
 * Calculates statistics about edge types in the graph
 */
export const calculateEdgeStats = (graphData: GraphData) => {
  const cohortMap = buildCohortMap(graphData);
  const allEdges = generateEdges(graphData);

  const stats = {
    total: allEdges.length,
    intraCohort: 0,
    crossCohort: 0,
    hwp: 0,
    bridge: 0,
  };

  allEdges.forEach((edge) => {
    const types = classifyEdge(edge, graphData, cohortMap);

    if (types.includes(EdgeType.INTRA_COHORT)) stats.intraCohort++;
    if (types.includes(EdgeType.CROSS_COHORT)) stats.crossCohort++;
    if (types.includes(EdgeType.HWP)) stats.hwp++;
    if (types.includes(EdgeType.BRIDGE)) stats.bridge++;
  });

  return stats;
};
