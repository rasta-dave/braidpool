// Mock data for braid visualization demos
import {
  BraidCohort,
  BraidNode,
  BraidLink,
  BraidColorTheme,
} from '../visualization/BraidTypes';

// Define cohort groups for demonstration
export const cohortGroups: BraidCohort[] = [
  { id: 0, label: 'Genesis', nodes: [0, 1, 2] },
  { id: 1, label: 'Cohort 1', nodes: [3, 4, 5, 6] },
  { id: 2, label: 'Cohort 2', nodes: [7, 8, 9] },
  { id: 3, label: 'Cohort 3', nodes: [10, 11, 12, 13] },
  { id: 4, label: 'Cohort 4', nodes: [14, 15, 16, 17, 18] },
  { id: 5, label: 'Cohort 5', nodes: [19, 20, 21] },
  { id: 6, label: 'Cohort 6', nodes: [22, 23] },
  { id: 7, label: 'Cohort 7', nodes: [24, 25, 26, 27, 28] },
  { id: 8, label: 'Cohort 8', nodes: [29] },
];

// Define high-work path for visualization
export const highWorkPath: number[] = [
  0, 1, 2, 4, 7, 9, 11, 13, 15, 18, 19, 20, 21, 22, 25, 28, 29,
];

// Node positions and data
export const nodePositions: BraidNode[] = [
  { id: 0, x: 42.888888888888886, y: 250 },
  { id: 1, x: 85.77777777777777, y: 250 },
  { id: 2, x: 128.66666666666666, y: 250 },
  { id: 3, x: 171.55555555555554, y: 100 },
  { id: 4, x: 171.55555555555554, y: 200 },
  { id: 5, x: 171.55555555555554, y: 300 },
  { id: 6, x: 171.55555555555554, y: 400 },
  { id: 7, x: 214.44444444444443, y: 200 },
  { id: 8, x: 214.44444444444443, y: 300 },
  { id: 9, x: 257.3333333333333, y: 250 },
  { id: 10, x: 300.2222222222222, y: 150 },
  { id: 11, x: 300.2222222222222, y: 250 },
  { id: 12, x: 300.2222222222222, y: 350 },
  { id: 13, x: 343.1111111111111, y: 250 },
  { id: 14, x: 386, y: 100 },
  { id: 15, x: 386, y: 200 },
  { id: 16, x: 386, y: 300 },
  { id: 17, x: 386, y: 400 },
  { id: 18, x: 428.88888888888886, y: 250 },
  { id: 19, x: 471.7777777777777, y: 250 },
  { id: 20, x: 514.6666666666666, y: 250 },
  { id: 21, x: 557.5555555555555, y: 250 },
  { id: 22, x: 600.4444444444443, y: 200 },
  { id: 23, x: 600.4444444444443, y: 300 },
  { id: 24, x: 643.3333333333333, y: 100 },
  { id: 25, x: 643.3333333333333, y: 200 },
  { id: 26, x: 643.3333333333333, y: 300 },
  { id: 27, x: 643.3333333333333, y: 400 },
  { id: 28, x: 686.2222222222222, y: 250 },
  { id: 29, x: 729.1111111111111, y: 250 },
];

// Define links for visualization
export const links: BraidLink[] = [
  { source: 0, target: 1 },
  { source: 1, target: 2 },
  { source: 2, target: 3 },
  { source: 2, target: 4 },
  { source: 2, target: 5 },
  { source: 3, target: 6 },
  { source: 5, target: 6 },
  { source: 4, target: 7 },
  { source: 6, target: 7 },
  { source: 4, target: 8 },
  { source: 6, target: 8 },
  { source: 8, target: 9 },
  { source: 7, target: 9 },
  { source: 9, target: 10 },
  { source: 9, target: 11 },
  { source: 9, target: 12 },
  { source: 10, target: 13 },
  { source: 11, target: 13 },
  { source: 12, target: 13 },
  { source: 13, target: 14 },
  { source: 13, target: 15 },
  { source: 13, target: 16 },
  { source: 14, target: 17 },
  { source: 15, target: 17 },
  { source: 16, target: 18 },
  { source: 17, target: 18 },
  { source: 18, target: 19 },
  { source: 19, target: 20 },
  { source: 20, target: 21 },
  { source: 21, target: 22 },
  { source: 21, target: 23 },
  { source: 22, target: 24 },
  { source: 23, target: 24 },
  { source: 22, target: 25 },
  { source: 23, target: 25 },
  { source: 24, target: 26 },
  { source: 24, target: 27 },
  { source: 25, target: 27 },
  { source: 26, target: 28 },
  { source: 27, target: 28 },
  { source: 28, target: 29 },
];

// Default colors for the visualization
export const getDefaultColors = (darkMode: boolean): BraidColorTheme => ({
  backgroundColor: darkMode ? 'rgb(30, 30, 30)' : 'rgb(245, 245, 245)',
  textColor: darkMode ? 'rgb(255, 255, 255)' : 'rgb(33, 33, 33)',
  nodeColors: [
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#d62728',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#7f7f7f',
    '#bcbd22',
    '#17becf',
  ],
  linkColor: darkMode ? '#555555' : '#999999',
  nodeStrokeColor: darkMode ? '#ffffff' : '#000000',
  tipNodeStrokeColor: '#ff6b6b',
  highlightColor: '#ffd700',
  highWorkPathColor: '#ff3366',
});

// Demo network statistics
export const mockNetworkStats = {
  nodeCount: 30,
  linkCount: 41,
  cohortCount: 9,
  tipCount: 1,
  genesisCount: 1,
};
