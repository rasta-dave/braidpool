import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import { BlockchainBlocks } from './';

// Sample mock data with more realistic values
const generateMockBlocks = (count: number, fillLevel: number = 0.5) => {
  const blocks = [];
  const startHeight = 1000;
  const BLOCK_WEIGHT_UNITS = 4000000; // Max block weight units

  for (let i = 0; i < count; i++) {
    // Generate random values with some consistency
    const txCount = Math.floor(Math.random() * 2500) + 10;
    // Size is related to transaction count and fill level
    const baseSize = Math.floor(txCount * 500 * fillLevel);
    // Weight is typically 4x size in segwit blocks
    const weight = Math.min(baseSize * 4, BLOCK_WEIGHT_UNITS);
    // More realistic fee calculation
    const feeRate = 5 + Math.random() * 50; // sat/vB

    blocks.push({
      height: startHeight + i,
      hash: `0000${Math.random().toString(16).slice(2, 14)}`,
      timestamp: Date.now() - i * 600000, // 10 minutes apart
      transactions: txCount,
      size: baseSize,
      weight: weight,
      fee: Math.round(feeRate), // sat/vB
      minFee: Math.round(feeRate * 0.7),
      maxFee: Math.round(feeRate * 1.5),
      isNew: i === 0, // Mark the latest block as new
    });
  }

  return blocks.reverse(); // Latest blocks first
};

const BlockchainDemo: React.FC = () => {
  const [blocks, setBlocks] = useState(generateMockBlocks(10));
  const [isLoading, setIsLoading] = useState(false);
  const [blockCount, setBlockCount] = useState(10);
  const [fillLevel, setFillLevel] = useState(0.5);
  const [animationSpeed, setAnimationSpeed] = useState(1000); // ms

  // Add new blocks on an interval to simulate mempool.space's live updates
  useEffect(() => {
    const interval = setInterval(() => {
      handleAddBlock(false);
    }, animationSpeed * 10);

    return () => clearInterval(interval);
  }, [blocks, fillLevel, animationSpeed]);

  const handleAddBlock = (showLoading: boolean = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    // Simulate network delay
    setTimeout(
      () => {
        const newBlock = generateMockBlocks(1, fillLevel)[0];
        newBlock.isNew = true;

        // Add the new block at the beginning and mark it as new
        setBlocks((prevBlocks) => {
          const newBlocks = [newBlock, ...prevBlocks.slice(0, blockCount - 1)];
          return newBlocks;
        });

        if (showLoading) {
          setIsLoading(false);
        }
      },
      showLoading ? animationSpeed : 0
    );
  };

  const handleChangeFillLevel = (_: Event, newValue: number | number[]) => {
    setFillLevel(newValue as number);
    // Generate new blocks with the new fill level
    setBlocks(generateMockBlocks(blockCount, newValue as number));
  };

  const handleBlockClick = (block: any) => {
    console.log('🔍 Block clicked:', block);
    alert(
      `Block ${block.block_height}\n${block.tx_count} transactions\nFee: ${block.total_fee} sat/vB\nSize: ${block.size} bytes\nWeight: ${block.weight} WU`
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Blockchain Visualization Demo
      </Typography>

      <Stack spacing={2} direction="row" sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleAddBlock(true)}
          disabled={isLoading}
        >
          Add New Block
        </Button>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Blocks</InputLabel>
          <Select
            value={blockCount}
            label="Blocks"
            onChange={(e) => {
              setBlockCount(Number(e.target.value));
              setBlocks(generateMockBlocks(Number(e.target.value), fillLevel));
            }}
          >
            <MenuItem value={5}>5 blocks</MenuItem>
            <MenuItem value={10}>10 blocks</MenuItem>
            <MenuItem value={15}>15 blocks</MenuItem>
            <MenuItem value={20}>20 blocks</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Animation Speed</InputLabel>
          <Select
            value={animationSpeed}
            label="Animation Speed"
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
          >
            <MenuItem value={500}>Fast (0.5s)</MenuItem>
            <MenuItem value={1000}>Normal (1s)</MenuItem>
            <MenuItem value={2000}>Slow (2s)</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ width: '100%', mb: 3 }}>
        <Typography gutterBottom>Block Fill Level</Typography>
        <Slider
          value={fillLevel}
          onChange={handleChangeFillLevel}
          step={0.1}
          marks
          min={0.1}
          max={1}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
        />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Latest Blocks
          </Typography>
          <BlockchainBlocks
            blocks={blocks.map((block) => ({
              block_height: block.height,
              block_hash: block.hash,
              hash: block.hash,
              height: block.height,
              size: block.size,
              weight: block.weight,
              tx_count: block.transactions,
              total_fee: block.fee,
              timestamp: Math.floor(block.timestamp / 1000), // Convert to seconds
              difficulty: 1000,
              median_time: Math.floor(block.timestamp / 1000),
              merkle_root: '',
              version: 1,
              bits: 0,
              nonce: 0,
              isNew: block.isNew,
            }))}
            loading={isLoading}
            maxBlocksToShow={blockCount}
            onBlockSelected={handleBlockClick}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Implementation Details
          </Typography>
          <Typography variant="body2" color="textSecondary" component="div">
            <ul>
              <li>
                The block visualization uses CSS pseudo-elements (::before and
                ::after) to create a realistic 3D isometric effect
              </li>
              <li>
                Dynamic block coloring represents fill level using gradients,
                with the colored portion representing percentage of max block
                weight
              </li>
              <li>
                Precise calculations for the 3D effect: top face uses
                skew(40deg) and side uses skewY(50deg) for accurate isometric
                appearance
              </li>
              <li>
                Block dimensions use CSS variables with specific ratios: height
                is 0.192 × width, side width is 0.16 × height
              </li>
              <li>
                Animations provide visual feedback for new blocks, state
                changes, and smooth transitions between states
              </li>
              <li>
                Fee range display shows the estimated min/max fee rates for each
                block
              </li>
              <li>
                Responsive design with adjusted proportions for different screen
                sizes
              </li>
            </ul>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BlockchainDemo;
