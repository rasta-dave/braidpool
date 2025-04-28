import React, { useState, useEffect, useRef, useCallback } from 'react';
import './BlockchainBlocks.css';
import { Link } from 'react-router-dom';
import { format, formatDistance } from 'date-fns';
import Block from './Block.tsx';
import { throttle } from 'lodash';

// Define BlockType interface directly
interface BlockType {
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

// Define block interface
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
  isNew?: boolean;
  hasChanged?: boolean;
}

interface BlockData extends BraidPoolBlock {
  isNew: boolean;
  hasChanged: boolean;
  changedProperties: string[];
  fillLevel: number;
  greenBackgroundHeight: number;
  minFee: number;
  maxFee: number;
}

interface BlockchainBlocksProps {
  blocks: BlockType[];
  onBlockSelect?: (block: BlockType) => void;
  changedBlocks?: string[];
  newBlocks?: string[];
  loading?: boolean;
  maxBlocksToShow?: number;
  onBlockSelected?: (block: any) => void;
}

// Weight units constant (similar to mempool.space approach)
const BLOCK_WEIGHT_UNITS = 4000000;

const BlockchainBlocks: React.FC<BlockchainBlocksProps> = ({
  blocks,
  onBlockSelect,
  changedBlocks = [],
  newBlocks = [],
  loading = false,
  maxBlocksToShow = 20,
  onBlockSelected,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const blockchainRef = useRef<HTMLDivElement>(null);

  // State for dragging and momentum
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [momentum, setMomentum] = useState({ speed: 0, timestamp: 0 });
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(true);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  // Calculate which blocks should be rendered (virtualization)
  const calculateVisibleBlocks = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollPosition = container.scrollLeft;
    const containerWidth = container.offsetWidth;

    // Calculate block width including margins (approximate)
    const blockWidth = 155; // Block size + margins

    // Calculate visible range with buffer for smooth scrolling
    const startIndex = Math.max(0, Math.floor(scrollPosition / blockWidth) - 5);
    const endIndex = Math.min(
      blocks.length,
      Math.ceil((scrollPosition + containerWidth) / blockWidth) + 5
    );

    setVisibleRange({ start: startIndex, end: endIndex });

    // Update scroll indicators
    setShowLeftIndicator(scrollPosition > 50);
    setShowRightIndicator(
      scrollPosition < container.scrollWidth - container.offsetWidth - 50
    );

    console.log(
      `🔄 Visible blocks: ${startIndex} - ${endIndex} (${
        endIndex - startIndex
      } blocks)`
    );
  }, [blocks.length]);

  // Throttle the visible blocks calculation to improve performance
  const throttledCalculateVisibleBlocks = useCallback(
    throttle(calculateVisibleBlocks, 100),
    [calculateVisibleBlocks]
  );

  // Handle regular scroll events
  const handleScroll = useCallback(() => {
    throttledCalculateVisibleBlocks();
  }, [throttledCalculateVisibleBlocks]);

  // Apply momentum scrolling when drag ends
  const applyMomentum = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { speed } = momentum;

    if (Math.abs(speed) < 0.5) {
      scrollAnimationRef.current = null;

      // Optional: Implement snap-to-block behavior
      const blockWidth = 155; // Block size + margins
      const targetPosition =
        Math.round(container.scrollLeft / blockWidth) * blockWidth;
      container.scrollTo({
        left: targetPosition,
        behavior: 'smooth',
      });

      return;
    }

    // Apply momentum with decay
    container.scrollLeft += speed;
    setMomentum((prev) => ({
      ...prev,
      speed: prev.speed * 0.95, // Decay factor
    }));

    console.log(`📊 Momentum scrolling - speed: ${speed.toFixed(2)}`);
    scrollAnimationRef.current = requestAnimationFrame(applyMomentum);
  }, [momentum]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);

    // Cancel any ongoing momentum scrolling
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }

    console.log(`🖱️ Mouse down at X: ${e.pageX}`);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const x = e.pageX - containerRef.current.offsetLeft;
      const walkX = (x - startX) * 1.5; // Multiply by 1.5 for faster dragging
      containerRef.current.scrollLeft = scrollLeft - walkX;

      // Calculate and store current momentum
      setMomentum({
        speed: walkX * 0.1, // Scale the momentum
        timestamp: Date.now(),
      });

      console.log(`🖱️ Mouse move - delta: ${walkX.toFixed(2)}`);
    },
    [isDragging, startX, scrollLeft]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // Start momentum animation
    if (Math.abs(momentum.speed) > 0.5) {
      scrollAnimationRef.current = requestAnimationFrame(applyMomentum);
    }

    console.log(`🖱️ Mouse up - final momentum: ${momentum.speed.toFixed(2)}`);
  }, [isDragging, momentum.speed, applyMomentum]);

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current || e.touches.length !== 1) return;

    setIsDragging(true);
    setStartX(e.touches[0].pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);

    // Cancel any ongoing momentum scrolling
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }

    console.log(`📱 Touch start at X: ${e.touches[0].pageX}`);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !containerRef.current || e.touches.length !== 1)
        return;

      const x = e.touches[0].pageX - containerRef.current.offsetLeft;
      const walkX = (x - startX) * 1.5;
      containerRef.current.scrollLeft = scrollLeft - walkX;

      // Calculate and store current momentum
      setMomentum({
        speed: walkX * 0.1,
        timestamp: Date.now(),
      });

      console.log(`📱 Touch move - delta: ${walkX.toFixed(2)}`);

      // Prevent default to stop page scrolling
      e.preventDefault();
    },
    [isDragging, startX, scrollLeft]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // Start momentum animation
    if (Math.abs(momentum.speed) > 0.5) {
      scrollAnimationRef.current = requestAnimationFrame(applyMomentum);
    }

    console.log(`📱 Touch end - final momentum: ${momentum.speed.toFixed(2)}`);
  }, [isDragging, momentum.speed, applyMomentum]);

  // Clean up event listeners and animation on unmount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set up event listeners for scroll
    container.addEventListener('scroll', handleScroll);

    // Calculate initial visible blocks
    calculateVisibleBlocks();

    // Clean up
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, [handleScroll, calculateVisibleBlocks]);

  // Set up mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mouseleave', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Set up touch event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
    } else {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  // Monitor window resize to recalculate visible blocks
  useEffect(() => {
    const handleResize = () => {
      calculateVisibleBlocks();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateVisibleBlocks]);

  // Watch for blocks updates to recalculate visible range
  useEffect(() => {
    calculateVisibleBlocks();
  }, [blocks, calculateVisibleBlocks]);

  // Only render blocks in the visible range (with buffer)
  const visibleBlocks = blocks.slice(visibleRange.start, visibleRange.end);

  // Determine fill level based on weight relative to max weight units
  const determineFillLevel = (
    weight: number,
    maxWeightUnits: number
  ): number => {
    const ratio = weight / maxWeightUnits;

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

  // Apply custom block style with dynamic gradient based on fill level
  const getBlockContentStyle = (block: BlockData): React.CSSProperties => {
    // Use repeating linear gradient to represent block contents visually
    return {
      background: `repeating-linear-gradient(
        to bottom,
        var(--block-secondary-color),
        var(--block-secondary-color) ${block.greenBackgroundHeight}%,
        var(--block-color-medium) ${Math.max(block.greenBackgroundHeight, 0)}%,
        var(--block-color-high) 100%
      )`,
    };
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

  // Format fee rate
  const formatFeeRate = (fee: number, round: boolean = false): string => {
    return round ? Math.round(fee).toString() : fee.toFixed(1);
  };

  const handleBlockClick = (block: BlockData) => {
    console.log('🧱 Block clicked:', block.block_height, block.block_hash);
    if (onBlockSelect) onBlockSelect(block as unknown as BlockType);
    if (onBlockSelected) onBlockSelected(block);
  };

  return (
    <div
      className={`blockchain-container ${isDragging ? 'dragging' : ''} ${
        momentum.speed !== 0 ? 'momentum' : ''
      }`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="blockchain" ref={blockchainRef}>
        {visibleBlocks.map((block, idx) => {
          const actualIndex = visibleRange.start + idx;
          const isChanged = changedBlocks.includes(block.hash);
          const isNew = newBlocks.includes(block.hash);

          console.log(
            `📦 Rendering block #${block.height} (hash: ${block.hash.substring(
              0,
              8
            )}...)`
          );

          return (
            <div
              key={`${block.hash}-${actualIndex}`}
              className="block-container"
            >
              <Block
                block={block}
                onClick={() => handleBlockClick(block as unknown as BlockData)}
                changed={isChanged}
                new={isNew}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BlockchainBlocks;
