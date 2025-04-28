import React, { useState, useEffect, useRef } from 'react';
import './BlockchainBlocks.css';
import { Link } from 'react-router-dom';
import { format, formatDistance } from 'date-fns';

interface BraidPoolBlock {
  block_height: number;
  block_hash: string;
  size: number;
  weight: number;
  tx_count: number;
  total_fee: number;
  timestamp: number;
  difficulty: number;
  median_time: number;
  merkle_root: string;
  version: number;
  bits: number;
  nonce: number;
}

interface BlockData extends BraidPoolBlock {
  isNew: boolean;
  hasChanged: boolean;
  changedProperties: string[];
  fillLevel: number;
}

interface BlockchainBlocksProps {
  blocks: BraidPoolBlock[];
  onBlockSelected: (block: BraidPoolBlock) => void;
  maxBlocksToShow?: number;
  loading?: boolean;
}

const BlockchainBlocks: React.FC<BlockchainBlocksProps> = ({
  blocks,
  onBlockSelected,
  maxBlocksToShow = 10,
  loading = false,
}) => {
  const [blockData, setBlockData] = useState<BlockData[]>([]);
  const [maxSize, setMaxSize] = useState<number>(1000000); // Default max size
  const blockchainRef = useRef<HTMLDivElement>(null);
  const previousBlocksRef = useRef<Record<number, BraidPoolBlock>>({});

  // Process blocks and track changes
  useEffect(() => {
    if (!blocks || blocks.length === 0) return;

    // Find the maximum block size for fill level calculation
    const currentMaxSize = Math.max(
      ...blocks.map((block) => block.size),
      maxSize
    );
    if (currentMaxSize > maxSize) {
      setMaxSize(currentMaxSize);
    }

    // Process each block and detect changes
    const newBlockData = blocks.map((block) => {
      const prevBlock = previousBlocksRef.current[block.block_height];
      const isNew = !prevBlock;

      let hasChanged = false;
      const changedProperties: string[] = [];

      if (prevBlock) {
        // Check what properties have changed
        if (prevBlock.size !== block.size) {
          hasChanged = true;
          changedProperties.push('size');
        }
        if (prevBlock.tx_count !== block.tx_count) {
          hasChanged = true;
          changedProperties.push('tx_count');
        }
        if (prevBlock.total_fee !== block.total_fee) {
          hasChanged = true;
          changedProperties.push('total_fee');
        }
        // Add other properties you want to track
      }

      // Calculate fill level (0-3)
      const fillLevel = determineFillLevel(block.size, currentMaxSize);

      return {
        ...block,
        isNew,
        hasChanged,
        changedProperties,
        fillLevel,
      };
    });

    setBlockData(newBlockData);

    // Update the previous blocks reference for next comparison
    const newPreviousBlocks: Record<number, BraidPoolBlock> = {};
    blocks.forEach((block) => {
      newPreviousBlocks[block.block_height] = { ...block };
    });
    previousBlocksRef.current = newPreviousBlocks;

    // Auto-scroll to the newest block if it's new
    if (
      newBlockData.length > 0 &&
      newBlockData[0].isNew &&
      blockchainRef.current
    ) {
      blockchainRef.current.scrollLeft = 0;
    }
  }, [blocks, maxSize]);

  // Determine fill level based on block size relative to max size
  const determineFillLevel = (size: number, maxSize: number): number => {
    const ratio = size / maxSize;

    if (ratio < 0.25) return 0; // low
    if (ratio < 0.5) return 1; // medium
    if (ratio < 0.75) return 2; // high
    return 3; // full
  };

  // Get CSS class for block content based on fill level
  const getBlockContentClass = (fillLevel: number): string => {
    switch (fillLevel) {
      case 0:
        return 'block-fill-low';
      case 1:
        return 'block-fill-medium';
      case 2:
        return 'block-fill-high';
      case 3:
        return 'block-fill-full';
      default:
        return 'block-fill-low';
    }
  };

  // Get container class based on block state
  const getBlockContainerClass = (block: BlockData): string => {
    if (block.isNew) return 'block-container new-block';
    if (block.hasChanged) return 'block-container changed-block';
    return 'block-container';
  };

  // Format timestamp to human-readable time
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return format(date, 'MMM d, yyyy HH:mm:ss');
  };

  // Format timestamp to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: number): string => {
    try {
      const date = new Date(timestamp * 1000);
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (error) {
      console.error('📊 Error formatting relative time:', error);
      return 'unknown time';
    }
  };

  // Format numbers with commas for readability
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Format file size in KB or MB
  const formatSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleBlockClick = (block: BlockData) => {
    console.log('🧱 Block clicked:', block.block_height, block.block_hash);
    onBlockSelected(block);
  };

  // Render loading skeleton when no blocks
  if (!blocks || blocks.length === 0) {
    return (
      <div className="blockchain-container" ref={blockchainRef}>
        <div className="blockchain">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="block-container loading">
              <div className="block">
                <div className="block-content">
                  <div className="block-header">
                    <span></span>
                    <span></span>
                  </div>
                  <div className="block-footer">
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
              <div className="block-info">
                <span></span>
                <span className="time-indicator"></span>
              </div>
              {index < 4 && <div className="chain-connector"></div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="blockchain-container" ref={blockchainRef}>
      <div className="blockchain">
        {blockData.map((block, index) => (
          <div key={block.block_hash} className={getBlockContainerClass(block)}>
            <div className="block" onClick={() => handleBlockClick(block)}>
              <Link to={`/block/${block.block_hash}`} className="blockLink" />
              <div
                className={`block-content ${getBlockContentClass(
                  block.fillLevel
                )}`}
              >
                <div className="block-header">
                  <span>#{formatNumber(block.block_height)}</span>
                  <span>{formatSize(block.size)}</span>
                </div>
                <div className="block-footer">
                  <span>Txs: {formatNumber(block.tx_count)}</span>
                  <span>Fee: {block.total_fee.toFixed(8)}</span>
                </div>
              </div>
            </div>
            <div className="block-info">
              <span title={formatTimestamp(block.timestamp)}>
                {formatRelativeTime(block.timestamp)}
              </span>
              <div className="fees">
                ~{(block.total_fee / block.tx_count).toFixed(1)} sat/vB
              </div>
              <div className="fee-span">
                {((block.total_fee / block.tx_count) * 0.8).toFixed(1)} -
                {((block.total_fee / block.tx_count) * 1.2).toFixed(1)} sat/vB
              </div>
              {block.hasChanged && (
                <span className="time-indicator">
                  Updated: {block.changedProperties.join(', ')}
                </span>
              )}
            </div>
            {index < blockData.length - 1 && (
              <div className="chain-connector"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockchainBlocks;
