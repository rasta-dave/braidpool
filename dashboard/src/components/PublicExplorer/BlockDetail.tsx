// This file exists to fix path resolution issues
// Re-export the BlockDetail component from its actual location
export { default } from './components/blocks/BlockDetail';
export type { Block, Transaction } from './components/blocks/BlockDetail';
