import React, { useEffect, useState, useRef } from 'react';
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

interface BlockData {
  height: number;
  hash: string;
  timestamp: number;
  work: number;
  parents: string[];
  transactions: number;
  difficulty: number;
  miner: string;
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

const mockNetworkStats: NetworkStats = {
  totalBlocks: 1250,
  totalTransactions: 25000,
  averageBlockTime: 2.5,
  networkHashrate: 1500,
  activeMiners: 5,
};

const PublicExplorer: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [networkStats, setNetworkStats] =
    useState<NetworkStats>(mockNetworkStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevBlocksRef = useRef<BlockData[]>([]);

  // Function to smoothly update blocks data
  const updateBlocksData = (newBlocks: BlockData[]) => {
    // Store current blocks for comparison
    prevBlocksRef.current = blocks;

    // If this is the first data load, just set it directly
    if (blocks.length === 0) {
      setBlocks(newBlocks);
      return;
    }

    // Otherwise update with smooth transition
    setBlocks(newBlocks);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (blocks.length === 0) {
          setLoading(true);
        }

        // Fetch blocks from API
        console.log('🔄 Fetching blocks from API...');
        const blocksResponse = await fetch('http://localhost:3100/blocks');
        if (!blocksResponse.ok) throw new Error('Failed to fetch blocks');
        const blocksData = await blocksResponse.json();
        console.log('✅ Blocks fetched successfully:', blocksData.length);
        updateBlocksData(blocksData);

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Braidpool Explorer
      </Typography>

      {/* Network Stats */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary">Total Blocks</Typography>
            <Typography variant="h4">{networkStats.totalBlocks}</Typography>
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
      </Box>

      {/* Block Timeline Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Block Timeline
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={blocks}
                // Add a key based on first and last block to maintain stable animations
                key={
                  blocks.length > 0
                    ? `chart-${blocks[0]?.hash.slice(0, 8)}-${blocks[
                        blocks.length - 1
                      ]?.hash.slice(0, 8)}`
                    : 'loading'
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="height"
                  // Add animation config for x-axis
                  allowDataOverflow={false}
                />
                <YAxis
                  yAxisId="left"
                  // Add animation config for y-axis
                  domain={['auto', 'auto']}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={['auto', 'auto']}
                />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="work"
                  stroke="#8884d8"
                  name="Work"
                  // Add smooth animation properties
                  isAnimationActive={true}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="difficulty"
                  stroke="#82ca9d"
                  name="Difficulty"
                  // Add smooth animation properties
                  isAnimationActive={true}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Recent Blocks Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Blocks
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Height</TableCell>
                  <TableCell>Hash</TableCell>
                  <TableCell>Miner</TableCell>
                  <TableCell>Transactions</TableCell>
                  <TableCell>Work</TableCell>
                  <TableCell>Difficulty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {blocks.map((block) => (
                  <TableRow key={block.hash}>
                    <TableCell>{block.height}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {block.hash.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{block.miner}</TableCell>
                    <TableCell>{block.transactions}</TableCell>
                    <TableCell>{block.work.toFixed(2)}</TableCell>
                    <TableCell>{block.difficulty}</TableCell>
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
