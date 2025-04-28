import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
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
  total_fee?: number;
  block_height?: number;
  block_hash?: string;
  minFee?: number;
  maxFee?: number;
  miner?: string;
  isMempool?: boolean;
}

interface BlockProps {
  block: BlockType;
  onClick: () => void;
  changed: boolean;
  new: boolean;
  loading?: boolean;
}

const Block: React.FC<BlockProps> = ({
  block,
  onClick,
  changed,
  new: isNew,
  loading = false,
}) => {
  // Calculate fill level based on weight or size
  const calculateFillLevel = () => {
    const BLOCK_WEIGHT_UNITS = 4000000;
    const weight = block.weight || block.size ? (block.size as number) * 4 : 0; // Fallback to size * 4 if weight not available
    return Math.min(100, Math.round((weight / BLOCK_WEIGHT_UNITS) * 100));
  };

  const fillLevel = calculateFillLevel();

  // Determine fill level class
  const getFillLevelClass = (): string => {
    if (fillLevel < 25) return 'block-fill-low';
    if (fillLevel < 50) return 'block-fill-medium';
    if (fillLevel < 75) return 'block-fill-high';
    return 'block-fill-full';
  };

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

  // Format relative time
  const formatRelativeTime = (timestamp: number): string => {
    try {
      return formatDistanceToNow(new Date(timestamp * 1000), {
        addSuffix: true,
      });
    } catch (error) {
      console.log('🕒 Error formatting relative time:', error);
      return '';
    }
  };

  // Format fee rate (sat/vB)
  const formatFeeRate = (fee?: number): string => {
    if (!fee) return '0';
    return (fee / 100).toFixed(1);
  };

  // Get transaction count (works with both formats seen in codebase)
  const getTxCount = (): number => {
    return block.tx_count || block.transactions || 0;
  };

  // Get fee rate
  const getFeeRate = (): number => {
    return block.total_fee || block.fee || 0;
  };

  // Determine block classes based on state
  const getBlockClass = (): string => {
    let classes = `block ${getFillLevelClass()}`;
    if (isNew) classes += ' block-new';
    if (changed) classes += ' block-changed';
    if (loading) classes += ' block-loading';
    if (block.isMempool) classes += ' block-mempool';
    return classes;
  };

  return (
    <div className={getBlockClass()}>
      {/* Clickable overlay */}
      <div className="block-link" onClick={onClick}></div>

      <div className="block-header">
        <span className="block-height">
          {formatNumber(block.height || block.block_height || 0)}
        </span>
        <span className="block-time">{formatTimestamp(block.timestamp)}</span>
      </div>

      <div className="block-content">
        <div className="block-stats">
          <div className="block-top-stats">
            <div className="block-fee">
              <span>{formatFeeRate(getFeeRate())} sat/vB</span>
              {(block.minFee || block.maxFee) && (
                <div className="block-fee-range">
                  {formatFeeRate(block.minFee)} - {formatFeeRate(block.maxFee)}{' '}
                  sat/vB
                </div>
              )}
            </div>

            {block.miner && (
              <div className="block-miner">
                <span className="pool-icon"></span>
                <span>{block.miner}</span>
              </div>
            )}
          </div>

          <div className="block-bottom-stats">
            <div className="block-txs">
              <span>{getTxCount()} txs</span>
            </div>
            <div className="block-size">
              <span>{((block.size || 0) / 1000).toFixed(1)} kB</span>
            </div>
          </div>
        </div>

        {/* Relative time (appears at the bottom) */}
        <div className="block-relative-time">
          {formatRelativeTime(block.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default Block;
