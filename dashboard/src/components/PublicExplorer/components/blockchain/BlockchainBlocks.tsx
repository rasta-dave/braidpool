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
const BLOCK_WIDTH = 170; // Width of block + margin
const BLOCK_PADDING = 15; // Padding between blocks

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
  const prevBlocksRef = useRef<BlockType[]>([]);
  const [blockStyles, setBlockStyles] = useState<{
    [key: string]: React.CSSProperties;
  }>({});
  const [initialRender, setInitialRender] = useState(true);

  // State for dragging and momentum
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [momentum, setMomentum] = useState({ speed: 0, timestamp: 0 });
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(true);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  // Calculate block positions and styles
  const calculateBlockStyles = useCallback(() => {
    const newStyles: { [key: string]: React.CSSProperties } = {};

    // Compare with previous blocks to detect new ones
    const prevHashes = prevBlocksRef.current.map((b) => b.hash);

    blocks.forEach((block, index) => {
      const isNew =
        newBlocks.includes(block.hash) || !prevHashes.includes(block.hash);
      const leftPosition = index * BLOCK_WIDTH;

      newStyles[block.hash] = {
        left: `${leftPosition}px`,
        opacity: 1,
        transform: isNew && !initialRender ? 'scale(1.05)' : 'scale(1)',
      };
    });

    // Add styles for blocks that were removed (to animate them out)
    prevBlocksRef.current.forEach((prevBlock) => {
      if (!blocks.find((b) => b.hash === prevBlock.hash)) {
        newStyles[prevBlock.hash] = {
          opacity: 0,
          transform: 'translateY(50px) scale(0.8)',
          left: '-200px',
        };
      }
    });

    setBlockStyles(newStyles);
    prevBlocksRef.current = [...blocks];

    if (initialRender) {
      setInitialRender(false);
    }
  }, [blocks, newBlocks, initialRender]);

  // Calculate which blocks should be rendered (virtualization)
  const calculateVisibleBlocks = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollPosition = container.scrollLeft;
    const containerWidth = container.offsetWidth;

    // Calculate visible range with buffer for smooth scrolling
    const startIndex = Math.max(
      0,
      Math.floor(scrollPosition / BLOCK_WIDTH) - 5
    );
    const endIndex = Math.min(
      blocks.length,
      Math.ceil((scrollPosition + containerWidth) / BLOCK_WIDTH) + 5
    );

    setVisibleRange({ start: startIndex, end: endIndex });

    // Update scroll indicators
    setShowLeftIndicator(scrollPosition > 50);
    setShowRightIndicator(
      scrollPosition < container.scrollWidth - container.offsetWidth - 50
    );

    console.log(`🔄 Visible blocks: ${startIndex} - ${endIndex}`);
  }, [blocks.length]);

  // Update block styles when blocks change
  useEffect(() => {
    calculateBlockStyles();
  }, [blocks, calculateBlockStyles]);

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

    if (Math.abs(speed) < 0.2) {
      scrollAnimationRef.current = null;
      return;
    }

    // Apply momentum with decay
    container.scrollLeft += speed;
    setMomentum((prev) => ({
      ...prev,
      speed: prev.speed * 0.97, // Slower decay for smoother scrolling
    }));

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
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const x = e.pageX - containerRef.current.offsetLeft;
      const walkX = (x - startX) * 2; // Increased multiplier for more responsive dragging
      containerRef.current.scrollLeft = scrollLeft - walkX;

      // Calculate and store current momentum
      setMomentum({
        speed: walkX * 0.15, // Increased momentum impact
        timestamp: Date.now(),
      });
    },
    [isDragging, startX, scrollLeft]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // Disable momentum scrolling completely
    setMomentum({ speed: 0, timestamp: 0 });

    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  }, [isDragging]);

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
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !containerRef.current || e.touches.length !== 1)
        return;

      const x = e.touches[0].pageX - containerRef.current.offsetLeft;
      const walkX = (x - startX) * 2; // Increased multiplier for more responsive touch
      containerRef.current.scrollLeft = scrollLeft - walkX;

      // Calculate and store current momentum
      setMomentum({
        speed: walkX * 0.15, // Increased momentum impact
        timestamp: Date.now(),
      });

      // Prevent default to stop page scrolling
      e.preventDefault();
    },
    [isDragging, startX, scrollLeft]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // Disable momentum scrolling completely
    setMomentum({ speed: 0, timestamp: 0 });

    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  }, [isDragging]);

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

  // Only render blocks in the visible range (with buffer)
  const visibleBlocks = blocks.slice(visibleRange.start, visibleRange.end);

  const handleBlockClick = (block: BlockData) => {
    console.log('🧱 Block clicked:', block.block_height, block.block_hash);
    if (onBlockSelect) onBlockSelect(block as unknown as BlockType);
    if (onBlockSelected) onBlockSelected(block);
  };

  return (
    <div
      className={`blockchain-container ${isDragging ? 'dragging' : ''}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="blockchain" ref={blockchainRef}>
        {blocks.map((block, idx) => {
          const isChanged = changedBlocks.includes(block.hash);
          const isNew = newBlocks.includes(block.hash);
          const style = blockStyles[block.hash] || {
            left: `${idx * BLOCK_WIDTH}px`,
          };

          return (
            <div
              key={`${block.hash}-${idx}`}
              className="block-container"
              style={style}
            >
              <Block
                block={block}
                onClick={() => handleBlockClick(block as unknown as BlockData)}
                changed={isChanged}
                new={isNew}
                loading={loading && isNew}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BlockchainBlocks;
