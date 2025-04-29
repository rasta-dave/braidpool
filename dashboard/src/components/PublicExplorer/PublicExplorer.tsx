import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Fade,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import './PublicExplorer.css';
import BlockDetail, { Block } from './components/blocks/BlockDetail';
import TransactionRoutes from './components/transactions/TransactionRoutes';
import TransactionDetails from './components/transactions/TransactionDetails';
import { BlockchainBlocks } from './components/blockchain';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

interface BlockData {
  height: number;
  hash: string;
  timestamp: number;
  work: number;
  parents: string[];
  transactions: number;
  difficulty: number;
  miner: string;
  size?: number;
  weight?: number;
  isNew?: boolean;
  changed?: string[];
}

interface TransactionData {
  txid: string;
  value: number;
  size: number;
  fee: number;
  timestamp: number;
  isNew?: boolean;
}

interface NetworkStats {
  totalBlocks: number;
  totalTransactions: number;
  averageBlockTime: number;
  networkHashrate: number;
  activeMiners: number;
  changed?: string[];
}

const generateMockBlocks = (count: number): BlockData[] => {
  const blocks: BlockData[] = [];
  let height = 1000;
  let work = 1000;
  const miners = ['Miner1', 'Miner2', 'Miner3', 'Miner4', 'Miner5'];

  for (let i = 0; i < count; i++) {
    blocks.push({
      height: height + i,
      hash: `0000000000000000000${Math.random().toString(16).slice(2, 10)}`,
      timestamp: Date.now() - i * 60000,
      work: work + Math.random() * 100,
      parents: [
        `0000000000000000000${Math.random().toString(16).slice(2, 10)}`,
        `0000000000000000000${Math.random().toString(16).slice(2, 10)}`,
      ],
      transactions: Math.floor(Math.random() * 50) + 1,
      difficulty: Math.floor(Math.random() * 1000) + 1000,
      miner: miners[Math.floor(Math.random() * miners.length)],
    });
  }

  return blocks;
};

const generateMockTransactions = (count: number): TransactionData[] => {
  const transactions: TransactionData[] = [];

  for (let i = 0; i < count; i++) {
    transactions.push({
      txid: `0000000000000000000${Math.random().toString(16).slice(2, 10)}`,
      value: Math.random() * 0.01,
      size: Math.floor(Math.random() * 200) + 100,
      fee: Math.floor(Math.random() * 10) + 1,
      timestamp: Date.now() - i * 60000,
    });
  }

  return transactions;
};

const mockNetworkStats: NetworkStats = {
  totalBlocks: 1250,
  totalTransactions: 25000,
  averageBlockTime: 2.5,
  networkHashrate: 1500,
  activeMiners: 5,
};

// Skeleton component for loading states
const SkeletonLoader = ({
  count = 5,
  type = 'row',
}: {
  count?: number;
  type?: 'row' | 'text';
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton skeleton-${type}`} />
      ))}
    </>
  );
};

// Component to render a network stat with change detection
const StatDisplay = ({
  label,
  value,
  isLoading,
  changedField,
}: {
  label: string;
  value: any;
  isLoading: boolean;
  changedField?: boolean;
}) => (
  <Card sx={{ flex: 1, minWidth: 200 }}>
    <CardContent>
      <Typography color="textSecondary">{label}</Typography>
      {isLoading ? (
        <div
          className="skeleton skeleton-text"
          style={{ height: '2rem', marginTop: '0.5rem' }}
        />
      ) : (
        <Typography
          variant="h4"
          className={`stats-value fade-in ${changedField ? 'changed' : ''}`}
        >
          {value}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const PublicExplorer: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [networkStats, setNetworkStats] =
    useState<NetworkStats>(mockNetworkStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayBlockCount, setDisplayBlockCount] = useState(12); // Default to show fewer blocks
  const prevBlocksRef = useRef<BlockData[]>([]);
  const prevStatsRef = useRef<NetworkStats>(mockNetworkStats);
  const prevTransactionsRef = useRef<TransactionData[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [blockDetailLoading, setBlockDetailLoading] = useState(false);
  const [blockDetailError, setBlockDetailError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const memoizedBlocks = useMemo(() => blocks, [blocks]);

  // Format timestamp to readable date/time
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  // Format BTC values with proper decimal places
  const formatBTC = (value: number): string => {
    return value.toFixed(8) + ' BTC';
  };

  // Function to handle search
  const handleSearch = () => {
    console.log('🔍 Searching for:', searchQuery);
    // In a real implementation, this would call an API endpoint
    // For now, just log the search query
    alert(`Search functionality would search for: ${searchQuery}`);
  };

  // Function to compare and mark changed fields in network stats
  const compareNetworkStats = (
    newStats: NetworkStats,
    oldStats: NetworkStats
  ): NetworkStats => {
    const changedFields: string[] = [];

    if (newStats.totalBlocks !== oldStats.totalBlocks)
      changedFields.push('totalBlocks');
    if (newStats.totalTransactions !== oldStats.totalTransactions)
      changedFields.push('totalTransactions');
    if (newStats.averageBlockTime !== oldStats.averageBlockTime)
      changedFields.push('averageBlockTime');
    if (newStats.networkHashrate !== oldStats.networkHashrate)
      changedFields.push('networkHashrate');
    if (newStats.activeMiners !== oldStats.activeMiners)
      changedFields.push('activeMiners');

    return {
      ...newStats,
      changed: changedFields.length > 0 ? changedFields : undefined,
    };
  };

  // Function to compare blocks and mark new/changed ones
  const compareBlocks = (
    newBlocks: BlockData[],
    oldBlocks: BlockData[]
  ): BlockData[] => {
    // Create a map of existing blocks by hash for quick lookup
    const oldBlocksMap = new Map<string, BlockData>();
    oldBlocks.forEach((block) => oldBlocksMap.set(block.hash, block));

    return newBlocks.map((block) => {
      const oldBlock = oldBlocksMap.get(block.hash);

      // If block is new
      if (!oldBlock) {
        return { ...block, isNew: true };
      }

      // Check if any fields changed
      const changedFields: string[] = [];
      if (block.work !== oldBlock.work) changedFields.push('work');
      if (block.transactions !== oldBlock.transactions)
        changedFields.push('transactions');
      if (block.difficulty !== oldBlock.difficulty)
        changedFields.push('difficulty');

      return {
        ...block,
        changed: changedFields.length > 0 ? changedFields : undefined,
      };
    });
  };

  // Function to compare transactions and mark new ones
  const compareTransactions = (
    newTxs: TransactionData[],
    oldTxs: TransactionData[]
  ): TransactionData[] => {
    const oldTxMap = new Map<string, TransactionData>();
    oldTxs.forEach((tx) => oldTxMap.set(tx.txid, tx));

    return newTxs.map((tx) => ({
      ...tx,
      isNew: !oldTxMap.has(tx.txid),
    }));
  };

  // Function to smoothly update blocks data with transition
  const updateBlocksData = (newBlocks: BlockData[]): void => {
    // If first load, just set the blocks directly
    if (blocks.length === 0) {
      console.log('🏁 Initial blocks loaded:', newBlocks.length);
      setBlocks(newBlocks);
      return;
    }

    // Otherwise transition smoothly to new data
    console.log('🔄 Updating blocks with smooth transition');

    // Sort blocks by height to ensure consistent ordering
    const sortedBlocks = [...newBlocks].sort((a, b) => a.height - b.height);

    // Compare with previous blocks to highlight changes
    const diffedBlocks = compareBlocks(sortedBlocks, prevBlocksRef.current);

    setBlocks(diffedBlocks);
    prevBlocksRef.current = sortedBlocks;
  };

  // Function to handle clicking on a block
  const handleBlockClick = async (hash: string) => {
    console.log(`🔍 Viewing block details for: ${hash}`);
    console.log(`🔍 Block hash type: ${typeof hash}, length: ${hash.length}`);
    console.log(
      `🔍 First 10 chars: "${hash.substring(
        0,
        10
      )}", last 10: "${hash.substring(hash.length - 10)}"`
    );

    setBlockDetailLoading(true);
    setBlockDetailError(null);

    try {
      // Make sure hash has correct format - ensure it starts with zeros if needed
      const formattedHash = hash.startsWith('0000') ? hash : `0000${hash}`;
      console.log(`🔄 Using formatted hash: ${formattedHash}`);

      const apiUrl = `http://localhost:3100/blocks/${formattedHash}`;
      console.log(`🔄 Fetching block details from: ${apiUrl}`);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API response not OK: ${response.status}`, errorText);

        // Try again with the original hash as a fallback
        console.log(`🔄 Retrying with original hash: ${hash}`);
        const fallbackUrl = `http://localhost:3100/blocks/${hash}`;
        const fallbackResponse = await fetch(fallbackUrl);

        if (!fallbackResponse.ok) {
          throw new Error(
            `Failed to fetch block details (${response.status}): ${errorText}`
          );
        }

        const blockData = await fallbackResponse.json();
        console.log('📦 Received block data on retry:', blockData);
        processBlockData(blockData);
      } else {
        const blockData = await response.json();
        console.log('📦 Received block data:', blockData);
        processBlockData(blockData);
      }
    } catch (err) {
      console.error('❌ Error fetching block details:', err);
      setBlockDetailError(
        err instanceof Error ? err.message : 'Failed to load block details'
      );
    } finally {
      setBlockDetailLoading(false);
    }
  };

  // Helper function to process block data
  const processBlockData = (blockData: any) => {
    // Transform the data to match the Block interface expected by BlockDetail
    const transformedBlock: Block = {
      hash: blockData.hash,
      height: blockData.height,
      timestamp: blockData.timestamp,
      difficulty: blockData.difficulty,
      merkleRoot: blockData.hash.substring(8, 40), // Using part of hash as mock merkle root
      nonce: Math.floor(Math.random() * 1000000),
      bits: (blockData.difficulty / 1000).toFixed(2),
      size: blockData.size || Math.floor(Math.random() * 1000) + 500,
      weight: blockData.weight || Math.floor(Math.random() * 3000) + 1500,
      version: 1,
      confirmations: Math.floor(Math.random() * 10) + 1,
      transactions:
        blockData.transactionData?.map((tx: any) => ({
          txid: tx.txid,
          timestamp: tx.timestamp,
          size: tx.size,
          weight: tx.size * 4, // Simple estimation of weight
          fee: parseFloat(tx.fee) * 100000000, // Convert to satoshis
          value: tx.value * 100000000, // Convert to satoshis
          inputs: tx.inputs,
          outputs: tx.outputs,
        })) || [],
      fees: parseFloat(blockData.totalFees || '0') * 100000000, // Convert to satoshis
      previousBlockHash: blockData.parents ? blockData.parents[0] : '',
      nextBlockHash:
        blockData.height < (blocks[0]?.height || 0)
          ? blocks.find((b) => b.height === blockData.height + 1)?.hash
          : undefined,
    };

    console.log('✅ Transformed block data:', transformedBlock);
    setSelectedBlock(transformedBlock);
    console.log('✅ Block details loaded successfully');
  };

  // Function to clear selected block and return to explorer
  const handleBackToExplorer = () => {
    setSelectedBlock(null);
    setBlockDetailError(null);

    // Navigate to explorer home if viewing transaction
    if (location.pathname.includes('/tx/')) {
      navigate('/explorer');
    }
  };

  // Toggle function to switch between showing fewer/more blocks
  const toggleBlockDisplay = () => {
    setDisplayBlockCount((prevCount) =>
      prevCount === 12 ? networkStats.totalBlocks : 12
    );
  };

  // Function to navigate back to dashboard
  const handleBackToDashboard = () => {
    console.log('🏠 Navigating back to dashboard');
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Skip data fetching if user is viewing block details
        if (selectedBlock) {
          console.log(
            '🔍 User is viewing block details - skipping data refresh'
          );
          return;
        }

        // Only show loading on first load
        if (blocks.length === 0) {
          setLoading(true);
        } else {
          // For subsequent loads, just set the fetching flag
          setIsFetchingData(true);
        }

        // Fetch blocks from API
        console.log('🔄 Fetching blocks from API...');
        const blocksResponse = await fetch('http://localhost:3100/blocks');
        if (!blocksResponse.ok) throw new Error('Failed to fetch blocks');
        const blocksData = await blocksResponse.json();
        console.log('✅ Blocks fetched successfully:', blocksData.length);

        // Add random size and weight to blocks
        const enhancedBlocks = blocksData.map((block: BlockData) => ({
          ...block,
          size: Math.floor(Math.random() * 1000) + 1000,
          weight: Math.floor(Math.random() * 1000) + 3000,
        }));

        updateBlocksData(enhancedBlocks);

        // Generate mock transactions for now
        // In a real implementation, this would fetch from an API
        const mockTxs = generateMockTransactions(10);

        // Compare with previous transactions to mark new ones
        const diffedTxs = compareTransactions(
          mockTxs,
          prevTransactionsRef.current
        );
        setTransactions(diffedTxs);
        prevTransactionsRef.current = mockTxs;

        // Fetch network stats from API
        console.log('🔄 Fetching network stats from API...');
        const statsResponse = await fetch('http://localhost:3100/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('✅ Network stats fetched successfully');

          // Compare with previous stats to highlight changes
          const diffedStats = compareNetworkStats(
            statsData,
            prevStatsRef.current
          );
          setNetworkStats(diffedStats);
          prevStatsRef.current = statsData;
        }

        if (initialLoad) {
          setInitialLoad(false);
        }
      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
        // Add a small delay before removing fetching state
        // This prevents the UI from flickering
        setTimeout(() => {
          setIsFetchingData(false);
        }, 300);
      }
    };

    // Fetch data once when the component mounts or when selectedBlock changes
    fetchData();

    // No interval setup - data only refreshes on component mount or when dependencies change

    // No cleanup needed since we're not setting up any intervals
  }, [selectedBlock]); // Keep selectedBlock in dependency array for conditional fetching

  // Skeleton loading screen for initial load
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Braidpool Explorer
        </Typography>

        {/* Search Bar Skeleton */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <div className="skeleton" style={{ height: '56px' }} />
          </CardContent>
        </Card>

        {/* Network Stats Skeleton */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} sx={{ flex: 1, minWidth: 200 }}>
              <CardContent>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: '70%', marginBottom: '1rem' }}
                />
                <div
                  className="skeleton skeleton-text"
                  style={{ height: '2rem' }}
                />
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Chart Skeleton */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <div
              className="skeleton skeleton-text"
              style={{ width: '30%', marginBottom: '1rem' }}
            />
            <div className="skeleton" style={{ height: '300px' }} />
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <div
              className="skeleton skeleton-text"
              style={{ width: '30%', marginBottom: '1rem' }}
            />
            <div
              className="skeleton"
              style={{ height: '50px', marginBottom: '0.5rem' }}
            />
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: '50px', marginBottom: '0.5rem' }}
              />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">Error: {error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box className="public-explorer">
      <Routes>
        <Route
          path="*"
          element={
            <Box>
              {/* Dashboard navigation button */}
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
              >
                <Typography variant="h4" gutterBottom>
                  Braidpool Explorer
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={handleBackToDashboard}
                  sx={{ height: 'fit-content' }}
                >
                  BACK TO DASHBOARD
                </Button>
              </Box>

              <ExplorerMainView
                selectedBlock={selectedBlock}
                handleBackToExplorer={handleBackToExplorer}
                blockDetailLoading={blockDetailLoading}
                blockDetailError={blockDetailError}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                networkStats={networkStats}
                initialLoad={initialLoad}
                memoizedBlocks={memoizedBlocks}
                displayBlockCount={displayBlockCount}
                handleBlockClick={handleBlockClick}
                isFetchingData={isFetchingData}
                blocks={blocks}
                formatDate={formatDate}
              />
            </Box>
          }
        />
      </Routes>
    </Box>
  );
};

// Extracted component to avoid nesting issues
const ExplorerMainView: React.FC<{
  selectedBlock: Block | null;
  handleBackToExplorer: () => void;
  blockDetailLoading: boolean;
  blockDetailError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  networkStats: any;
  initialLoad: boolean;
  memoizedBlocks: any[];
  displayBlockCount: number;
  handleBlockClick: (hash: string) => void;
  isFetchingData: boolean;
  blocks: any[];
  formatDate: (timestamp: number) => string;
}> = ({
  selectedBlock,
  handleBackToExplorer,
  blockDetailLoading,
  blockDetailError,
  searchQuery,
  setSearchQuery,
  handleSearch,
  networkStats,
  initialLoad,
  memoizedBlocks,
  displayBlockCount,
  handleBlockClick,
  isFetchingData,
  blocks,
  formatDate,
}) => {
  return (
    <Box>
      {/* Breadcrumbs navigation */}
      <Box sx={{ mb: 2 }}>
        {selectedBlock ? (
          <Breadcrumbs separator="›" aria-label="breadcrumb">
            <MuiLink
              component="button"
              variant="body1"
              onClick={handleBackToExplorer}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              underline="hover"
            >
              <ArrowBackIcon sx={{ mr: 0.5, fontSize: '0.8rem' }} />
              Explorer
            </MuiLink>
            <Typography color="text.primary">
              Block #{selectedBlock.height}
            </Typography>
          </Breadcrumbs>
        ) : null}
      </Box>

      {/* Rest of existing explorer UI */}
      {selectedBlock ? (
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToExplorer}
            sx={{ mb: 2 }}
          >
            Back to Explorer
          </Button>
          <BlockDetail
            block={selectedBlock}
            isLoading={blockDetailLoading}
            error={blockDetailError || undefined}
          />
        </Box>
      ) : (
        <>
          {/* Search Bar */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search for block height, hash, transaction, or address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ mr: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleSearch}>
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Network Stats */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <StatDisplay
              label="Total Blocks"
              value={networkStats.totalBlocks}
              isLoading={initialLoad}
              changedField={networkStats.changed?.includes('totalBlocks')}
            />
            <StatDisplay
              label="Network Hashrate"
              value={`${networkStats.networkHashrate} TH/s`}
              isLoading={initialLoad}
              changedField={networkStats.changed?.includes('networkHashrate')}
            />
            <StatDisplay
              label="Active Miners"
              value={networkStats.activeMiners}
              isLoading={initialLoad}
              changedField={networkStats.changed?.includes('activeMiners')}
            />
            <StatDisplay
              label="Avg Block Time"
              value={`${networkStats.averageBlockTime} sec`}
              isLoading={initialLoad}
              changedField={networkStats.changed?.includes('averageBlockTime')}
            />
          </Box>

          {/* Blockchain Visualization */}
          <Card sx={{ mb: 3 }} className="explorer-card">
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '300px',
              }}
            >
              {/* Spacer div to maintain vertical positioning */}
              <Box sx={{ height: '32px', mb: '8px' }}></Box>
              <BlockchainBlocks
                blocks={memoizedBlocks.map((block) => ({
                  block_height: block.height,
                  block_hash: block.hash,
                  hash: block.hash,
                  height: block.height,
                  size: block.size || 1000,
                  weight: block.weight || 4000,
                  tx_count: block.transactions,
                  total_fee: block.difficulty / 10,
                  timestamp: Math.floor(block.timestamp / 1000),
                  difficulty: block.difficulty,
                  median_time: Math.floor(block.timestamp / 1000),
                  merkle_root: '',
                  version: 1,
                  bits: 0,
                  nonce: 0,
                  isNew: block.isNew,
                  hasChanged:
                    Array.isArray(block.changed) && block.changed.length > 0,
                  changedProperties: block.changed || [],
                }))}
                loading={initialLoad}
                maxBlocksToShow={displayBlockCount}
                onBlockSelected={(block) => handleBlockClick(block.block_hash)}
              />
            </CardContent>
          </Card>

          {/* Block Timeline Chart */}
          <Card sx={{ mb: 3 }} className="explorer-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Block Timeline
              </Typography>
              <Box sx={{ height: 300 }} className="chart-container">
                {initialLoad ? (
                  <div className="skeleton" style={{ height: '100%' }} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={memoizedBlocks}
                      key="block-timeline-chart"
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="height"
                        allowDataOverflow={false}
                        tickFormatter={(value) => value.toString()}
                      />
                      <YAxis
                        yAxisId="left"
                        domain={['auto', 'auto']}
                        allowDataOverflow={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={['auto', 'auto']}
                        allowDataOverflow={false}
                      />
                      <Tooltip
                        animationDuration={300}
                        animationEasing="ease-out"
                        formatter={(value, name) => {
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="work"
                        stroke="#8884d8"
                        name="Work"
                        isAnimationActive={!isFetchingData}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5, strokeWidth: 1 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="difficulty"
                        stroke="#82ca9d"
                        name="Difficulty"
                        isAnimationActive={!isFetchingData}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5, strokeWidth: 1 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Latest Blocks Table */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Latest Blocks</Typography>
                <Button variant="text" color="primary">
                  View more blocks
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Height</TableCell>
                      <TableCell>Hash</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Miner</TableCell>
                      <TableCell>Transactions</TableCell>
                      <TableCell>Size (KB)</TableCell>
                      <TableCell>Weight (KWU)</TableCell>
                      <TableCell>Work</TableCell>
                      <TableCell>Difficulty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {initialLoad
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 9 }).map((_, j) => (
                              <TableCell key={j}>
                                <div className="skeleton skeleton-text" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : blocks.slice(0, 5).map((block) => (
                          <TableRow
                            key={block.hash}
                            hover
                            className={`table-row clickable ${
                              block.isNew ? 'new-data' : ''
                            } ${block.changed?.length ? 'changed' : ''}`}
                            onClick={() => {
                              console.log(
                                `🔍 Viewing block details for: ${block.hash}`
                              );
                              handleBlockClick(block.hash);
                            }}
                          >
                            <TableCell>{block.height}</TableCell>
                            <TableCell>{block.hash}</TableCell>
                            <TableCell>{formatDate(block.timestamp)}</TableCell>
                            <TableCell>{block.miner}</TableCell>
                            <TableCell>{block.transactions}</TableCell>
                            <TableCell>{block.size}</TableCell>
                            <TableCell>{block.weight}</TableCell>
                            <TableCell>{block.work}</TableCell>
                            <TableCell>{block.difficulty}</TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default PublicExplorer;
