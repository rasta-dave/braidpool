export interface BraidData {
  description: string;
  parents: Record<string, number[]>;
  children: Record<string, number[]>;
  tips: number[];
  cohorts: number[][];
  work?: Record<number | string, number>;
  highest_work_path?: (number | string)[];
  bead_count?: number;
}

export interface BraidNode {
  id: string;
  parents: string[];
  children: string[];
  cohort: number;
  isTip: boolean;
  work?: number;
  isOnHighWorkPath?: boolean;
}

export interface BraidLink {
  source: string;
  target: string;
  isHighWorkPath?: boolean;
}

export interface BraidVisualizationData {
  nodes: BraidNode[];
  links: BraidLink[];
  cohorts: string[][];
}
