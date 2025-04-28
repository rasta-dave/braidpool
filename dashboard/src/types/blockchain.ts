export interface BlockType {
  hash: string;
  height: number;
  timestamp: number;
  size: number;
  weight: number;
  tx_count: number;
  total_fee: number;
  difficulty: number;
  median_time: number;
  merkle_root: string;
  version: number;
  bits: number;
  nonce: number;
  isNew?: boolean;
  hasChanged?: boolean;
  block_height?: number;
  block_hash?: string;
}
