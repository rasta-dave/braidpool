import React from 'react';
import { format } from 'date-fns';
import './Block.css';

// Define BlockType based on the interfaces seen in the codebase
interface BlockType {
  hash?: string;
  height: number;
  timestamp: number;
  size?: number;
  weight?: number;
  tx_count?: number;
  fee?: number;
  difficulty?: number;
  transactions?: number;
}

interface BlockProps {
  block: BlockType;
  onClick: () => void;
  changed: boolean;
  new: boolean;
}

const Block: React.FC<BlockProps> = ({
  block,
  onClick,
  changed,
  new: isNew,
}) => {
  // Calculate fill level based on weight or size
  const calculateFillLevel = () => {
    const BLOCK_WEIGHT_UNITS = 4000000;
    const weight = block.weight || block.size ? (block.size as number) * 4 : 0; // Fallback to size * 4 if weight not available
    return Math.min(100, Math.round((weight / BLOCK_WEIGHT_UNITS) * 100));
  };

  const fillLevel = calculateFillLevel();

  // Format height with commas for thousands
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    try {
      return format(new Date(timestamp * 1000), 'HH:mm:ss');
    } catch (error) {
      console.log('🕒 Error formatting timestamp:', error);
      return 'Invalid time';
    }
  };

  // Calculate background height for visual fill indicator
  const greenBackgroundHeight = Math.max(5, Math.min(100, fillLevel));

  // Determine block classes based on state
  const getBlockClass = (): string => {
    let classes = 'block';
    if (isNew) classes += ' block-new';
    if (changed) classes += ' block-changed';
    return classes;
  };

  // Get transaction count (works with both formats seen in codebase)
  const getTxCount = (): number => {
    return block.tx_count || block.transactions || 0;
  };

  return (
    <div className={getBlockClass()} onClick={onClick}>
      <div className="block-header">
        <span className="block-height">{formatNumber(block.height)}</span>
        <span className="block-time">{formatTimestamp(block.timestamp)}</span>
      </div>

      <div className="block-content">
        <div
          className="block-fill-indicator"
          style={{ height: `${greenBackgroundHeight}%` }}
        />

        <div className="block-stats">
          <div className="block-txs">
            <span>{getTxCount()} txs</span>
          </div>
          <div className="block-size">
            <span>{((block.size || 0) / 1000).toFixed(1)} kB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Block;
