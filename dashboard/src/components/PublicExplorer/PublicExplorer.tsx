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
import './PublicExplorer.css';

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
}

interface TransactionData {
  txid: string;
  value: number;
  size: number;
  fee: number;
  timestamp: number;
}

interface NetworkStats {
  totalBlocks: number;
  totalTransactions: number;
  averageBlockTime: number;
  networkHashrate: number;
  activeMiners: number;
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

const PublicExplorer: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [networkStats, setNetworkStats] =
    useState<NetworkStats>(mockNetworkStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const prevBlocksRef = useRef<BlockData[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);

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

  // Function to smoothly update blocks data with transition
  const updateBlocksData = (newBlocks: BlockData[]): void => {
    prevBlocksRef.current = blocks;

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
    setBlocks(sortedBlocks);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
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
        setTransactions(mockTxs);

        // Fetch network stats from API
        console.log('🔄 Fetching network stats from API...');
        const statsResponse = await fetch('http://localhost:3100/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('✅ Network stats fetched successfully');
          setNetworkStats(statsData);
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

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
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
    <Box
      sx={{ p: 3 }}
      className={`explorer-container ${isFetchingData ? 'updating' : ''}`}
    >
      <Typography variant="h4" gutterBottom>
        Braidpool Explorer
      </Typography>

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
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary">Total Blocks</Typography>
            <Typography variant="h4" className="stats-value fade-in">
              {networkStats.totalBlocks}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary">Network Hashrate</Typography>
            <Typography variant="h4">
              {networkStats.networkHashrate} TH/s
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary">Active Miners</Typography>
            <Typography variant="h4">{networkStats.activeMiners}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary">Avg Block Time</Typography>
            <Typography variant="h4">
              {networkStats.averageBlockTime} sec
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Block Timeline Chart */}
      <Card sx={{ mb: 3 }} className="explorer-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Block Timeline
          </Typography>
          <Box sx={{ height: 300 }} className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={memoizedBlocks}
                key="block-timeline-chart"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
                <Tooltip animationDuration={300} animationEasing="ease-out" />
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
                {blocks.slice(0, 5).map((block) => (
                  <TableRow
                    key={block.hash}
                    hover
                    className="table-row fade-in"
                  >
                    <TableCell>{block.height}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {block.hash.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{formatDate(block.timestamp)}</TableCell>
                    <TableCell>{block.miner}</TableCell>
                    <TableCell>{block.transactions}</TableCell>
                    <TableCell>{(block.size! / 1024).toFixed(3)}</TableCell>
                    <TableCell>{(block.weight! / 1024).toFixed(3)}</TableCell>
                    <TableCell>{block.work.toFixed(2)}</TableCell>
                    <TableCell>{block.difficulty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Latest Transactions */}
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Latest Transactions</Typography>
            <Button variant="text" color="primary">
              View more transactions
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Fee (sat/vB)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.slice(0, 5).map((tx) => (
                  <TableRow key={tx.txid} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {tx.txid.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{formatDate(tx.timestamp)}</TableCell>
                    <TableCell>{formatBTC(tx.value)}</TableCell>
                    <TableCell>{tx.size} vB</TableCell>
                    <TableCell>{tx.fee.toFixed(1)} sat/vB</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PublicExplorer;
