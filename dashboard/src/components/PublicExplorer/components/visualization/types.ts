/**
 * Interface for a graph node with connections
 */
export interface GraphNode {
  id: string;
  parents: string[];
  children: string[];
}

/**
 * Maps hash strings to sequential IDs
 */
export interface NodeIdMapping {
  [hash: string]: string; // maps hash to sequential ID
}

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
 * Position interface for node layout
 */
export interface Position {
  x: number;
  y: number;
}
