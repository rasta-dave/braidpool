import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';

const app = express();
const port = 3100;

// Create WebSocket connection to simulator
let ws: any = null;
let isConnected = false;
let latestBlocks: any[] = [];
let networkStats = {
  totalBlocks: 0,
  totalTransactions: 0,
  averageBlockTime: 2.5,
  networkHashrate: 0,
  activeMiners: 0,
};

function connectToSimulator() {
  console.log('🔄 Connecting to simulator WebSocket...');
  ws = new WebSocket('ws://localhost:65433/ws');

  ws.on('open', () => {
    console.log('✅ Connected to simulator WebSocket!');
    isConnected = true;
  });

  ws.on('message', (data: any) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message from simulator:', message.type);

      if (message.type === 'braid_update') {
        // Transform braid data into block format
        const transformedData = transformBraidToBlocks(message.data);
        latestBlocks = transformedData;

        // Update network stats
        updateNetworkStats(message.data);

        console.log('🔄 Updated blocks data:', latestBlocks.length);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  });

  ws.on('error', (error: any) => {
    console.error('❌ WebSocket error:', error);
    isConnected = false;
  });

  ws.on('close', () => {
    console.log('❌ Disconnected from simulator, attempting to reconnect...');
    isConnected = false;
    setTimeout(connectToSimulator, 5000);
  });
}

function transformBraidToBlocks(braidData: any) {
  const blocks = [];
  const miners = ['Miner1', 'Miner2', 'Miner3', 'Miner4', 'Miner5'];
  let height = 1000;

  if (!braidData || !braidData.cohorts || !braidData.parents) {
    console.warn('⚠️ Invalid braid data received');
    return [];
  }

  // Process each cohort (most recent first)
  for (const cohort of braidData.cohorts.slice().reverse()) {
    for (const hash of cohort) {
      const randomMiner = miners[Math.floor(Math.random() * miners.length)];
      const parents = braidData.parents[hash] || [];

      blocks.push({
        height: height++,
        hash: hash,
        timestamp: Date.now() - blocks.length * 60000,
        work: (parseInt(hash.substring(0, 8), 16) % 100) + 1000, // Extract some work value from the hash
        parents: parents,
        transactions: Math.floor(Math.random() * 50) + 1, // Random tx count for now
        difficulty: Math.floor(Math.random() * 1000) + 1000, // Random difficulty for now
        miner: randomMiner,
      });
    }
  }

  // Only return the most recent 20 blocks
  return blocks.slice(0, 20);
}

function updateNetworkStats(braidData: any) {
  if (!braidData || !braidData.cohorts) return;

  // Count total blocks from all cohorts
  const totalBlocks = braidData.cohorts.reduce(
    (sum: number, cohort: any[]) => sum + cohort.length,
    0
  );

  networkStats = {
    totalBlocks,
    totalTransactions: totalBlocks * 25, // Estimate: avg 25 txs per block
    averageBlockTime: 2.5,
    networkHashrate: 1500 + Math.floor(Math.random() * 200), // Simulated hashrate with variation
    activeMiners: 5,
  };

  console.log('📊 Updated network stats:', networkStats);
}

// Connect to simulator on startup
connectToSimulator();

app.use(cors());
app.use(express.json());

// API endpoints
app.get('/blocks', (req, res) => {
  console.log('📡 GET /blocks request received');

  if (latestBlocks.length === 0) {
    console.log('⚠️ No blocks data available yet, generating mock data');
    // Generate mock data if we don't have real data yet
    const mockBlocks = generateMockBlocks(20);
    res.json(mockBlocks);
    return;
  }

  console.log('📦 Sending blocks data:', latestBlocks.length);
  res.json(latestBlocks);
});

app.get('/stats', (req, res) => {
  console.log('📡 GET /stats request received');
  res.json(networkStats);
});

// Fallback mock data generator
const generateMockBlocks = (count: number) => {
  const blocks = [];
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

// Start the server
app.listen(port, () => {
  console.log(`🚀 Mock API server running at http://localhost:${port}`);
});
